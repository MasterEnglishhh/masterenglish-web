param(
    [Parameter(Mandatory = $true)][int]$BackendProcessId,
    [ValidateSet('verify','verify-final')][string]$Phase = 'verify'
)
$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskRuntime = (Resolve-Path (Join-Path $taskRoot '.audit/runtime/backend')).Path
$taskEvidence = (Resolve-Path (Join-Path $taskRoot '.audit/evidence')).Path
$taskProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $BackendProcessId"
if (-not $taskProcess -or $taskProcess.Name -ne 'java.exe' -or $taskProcess.CommandLine -notmatch 'app\.jar' -or $taskProcess.CommandLine -notmatch 'spring\.profiles\.active=local') {
    throw 'Refusing to terminate a process that is not the dedicated local Java runtime.'
}
if (-not (Get-NetTCPConnection -State Listen -LocalPort 28081 | Where-Object { $_.OwningProcess -eq $BackendProcessId })) {
    throw 'The selected process does not own the dedicated audit API port.'
}
$taskContainerRaw = docker inspect masterenglish-audit-9975
if ($LASTEXITCODE -ne 0) { throw 'Dedicated database is unavailable.' }
$taskContainer = ($taskContainerRaw | ConvertFrom-Json)[0]
if ($taskContainer.Config.Labels.'masterenglish.audit' -ne '9975' -or $taskContainer.HostConfig.PortBindings.'5432/tcp'[0].HostPort -ne '25433') {
    throw 'Database identity check failed.'
}
Stop-Process -Id $BackendProcessId -Force
docker kill --signal KILL masterenglish-audit-9975 | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not crash the dedicated database.' }
docker start masterenglish-audit-9975 | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not restart the dedicated database.' }
$taskDatabaseReady = $false
for ($taskAttempt = 0; $taskAttempt -lt 60; $taskAttempt++) {
    docker exec masterenglish-audit-9975 pg_isready -U audit -d masterenglish_audit *> $null
    if ($LASTEXITCODE -eq 0) { $taskDatabaseReady = $true; break }
    Start-Sleep -Milliseconds 500
}
if (-not $taskDatabaseReady) { throw 'Database did not recover.' }
$taskJava = (Get-Command java).Source
$env:MASTERENGLISH_ENV_FILE = Join-Path $taskRuntime '.env'
$taskNewProcess = Start-Process -FilePath $taskJava -ArgumentList @('-Duser.timezone=UTC', '-jar', 'build/libs/app.jar', '--spring.profiles.active=local') -WorkingDirectory $taskRuntime -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskEvidence "be-recovery-$Phase-runtime.log") -RedirectStandardError (Join-Path $taskEvidence "be-recovery-$Phase-stderr.log")
Set-Content -LiteralPath (Join-Path $taskRuntime 'runtime.pid') -Value $taskNewProcess.Id -Encoding ASCII
$taskApiReady = $false
for ($taskAttempt = 0; $taskAttempt -lt 120; $taskAttempt++) {
    try {
        $taskHealth = Invoke-RestMethod -Uri 'http://127.0.0.1:28081/api/actuator/health' -TimeoutSec 2
        if ($taskHealth.status -eq 'UP') { $taskApiReady = $true; break }
    } catch {}
    if ($taskNewProcess.HasExited) { throw 'API exited during recovery.' }
    Start-Sleep -Milliseconds 500
}
if (-not $taskApiReady) { throw 'API did not recover.' }
Push-Location $taskRoot
try {
    node scripts/acceptance/backend-probe.mjs "recovery-$Phase"
    if ($LASTEXITCODE -ne 0) { throw 'Recovery verification failed.' }
} finally { Pop-Location }
Write-Output "Recovered runtime PID=$($taskNewProcess.Id); PostgreSQL WAL crash/restart and API replay verified."
