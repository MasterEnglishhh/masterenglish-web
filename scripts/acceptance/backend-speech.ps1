param([Parameter(Mandatory = $true)][string]$Manifest)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
Add-Type -AssemblyName System.Drawing
$taskManifest = Get-Content -LiteralPath $Manifest -Raw | ConvertFrom-Json
$taskSpeech = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    if ($taskSpeech.GetInstalledVoices().Count -lt 1) { throw 'No local TTS voices installed.' }
    foreach ($taskClip in $taskManifest.audio) {
        $taskPrompt = New-Object System.Speech.Synthesis.PromptBuilder
        foreach ($taskLine in $taskClip.lines) {
            if ($taskLine.text) {
                $taskVoice = if ($taskLine.speaker -like 'W*') { 'Microsoft Zira Desktop' } else { 'Microsoft David Desktop' }
                $taskPrompt.StartVoice($taskVoice)
                $taskPrompt.AppendText($taskLine.text)
                $taskPrompt.EndVoice()
            }
            if ($taskLine.pause) { $taskPrompt.AppendBreak([TimeSpan]::FromSeconds([double]$taskLine.pause)) }
        }
        $taskSpeech.SetOutputToWaveFile($taskClip.path)
        $taskSpeech.Speak($taskPrompt)
        $taskSpeech.SetOutputToNull()
        if ((Get-Item -LiteralPath $taskClip.path).Length -le 44) { throw 'Speech synthesis returned no PCM data.' }
    }
} finally { $taskSpeech.Dispose() }

function Draw-Person($taskGraphics, [int]$taskX, [int]$taskY, [System.Drawing.Brush]$taskClothes) {
    $taskGraphics.FillEllipse([Drawing.Brushes]::SandyBrown, $taskX, $taskY, 42, 42)
    $taskGraphics.FillRectangle($taskClothes, ($taskX - 6), ($taskY + 42), 54, 92)
    $taskGraphics.FillRectangle([Drawing.Brushes]::MidnightBlue, ($taskX - 4), ($taskY + 134), 20, 86)
    $taskGraphics.FillRectangle([Drawing.Brushes]::MidnightBlue, ($taskX + 25), ($taskY + 134), 20, 86)
}
foreach ($taskImage in $taskManifest.images) {
    $taskBitmap = New-Object Drawing.Bitmap 640,420
    $taskGraphics = [Drawing.Graphics]::FromImage($taskBitmap)
    $taskGraphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $taskPen = New-Object Drawing.Pen ([Drawing.Color]::SandyBrown), 16
    try {
        $taskGraphics.Clear([Drawing.Color]::AliceBlue)
        $taskGraphics.FillRectangle([Drawing.Brushes]::LightGray, 0, 350, 640, 70)
        if ($taskImage.scene -eq 'workers') {
            $taskGraphics.FillRectangle([Drawing.Brushes]::SaddleBrown, 435, 35, 170, 315)
            $taskGraphics.FillRectangle([Drawing.Brushes]::WhiteSmoke, 450, 50, 140, 300)
            Draw-Person $taskGraphics 110 115 ([Drawing.Brushes]::DarkOrange)
            Draw-Person $taskGraphics 425 115 ([Drawing.Brushes]::Goldenrod)
            $taskGraphics.DrawLine($taskPen, 110, 190, 175, 236)
            $taskGraphics.DrawLine($taskPen, 465, 190, 425, 236)
            $taskGraphics.FillRectangle([Drawing.Brushes]::Peru, 165, 229, 270, 21)
            $taskGraphics.FillRectangle([Drawing.Brushes]::SaddleBrown, 185, 250, 15, 70)
            $taskGraphics.FillRectangle([Drawing.Brushes]::SaddleBrown, 399, 250, 15, 70)
        } else {
            $taskGraphics.FillRectangle([Drawing.Brushes]::LightSteelBlue, 0, 340, 640, 12)
            for ($taskBar=0; $taskBar -lt 7; $taskBar++) { $taskGraphics.FillRectangle([Drawing.Brushes]::SlateGray, ($taskBar*100), 260, 9, 110) }
            Draw-Person $taskGraphics 180 100 ([Drawing.Brushes]::MediumPurple)
            $taskGraphics.FillEllipse([Drawing.Brushes]::SaddleBrown, 174, 94, 51, 23)
            $taskGraphics.DrawLine($taskPen, 215, 174, 280, 211)
            $taskGraphics.FillRectangle([Drawing.Brushes]::RoyalBlue, 272, 200, 55, 35)
            $taskGraphics.FillPolygon([Drawing.Brushes]::RoyalBlue, [Drawing.Point[]]@((New-Object Drawing.Point 320,213),(New-Object Drawing.Point 360,230),(New-Object Drawing.Point 354,241)))
            for ($taskDrop=0; $taskDrop -lt 5; $taskDrop++) { $taskGraphics.FillEllipse([Drawing.Brushes]::DodgerBlue, (350+$taskDrop*8), (238+$taskDrop*10), 5, 12) }
            foreach ($taskPlantX in @(360,450,535)) {
                $taskGraphics.FillRectangle([Drawing.Brushes]::Chocolate, $taskPlantX, 290, 48, 50)
                $taskGraphics.FillEllipse([Drawing.Brushes]::ForestGreen, ($taskPlantX-9), 247, 37, 55)
                $taskGraphics.FillEllipse([Drawing.Brushes]::SeaGreen, ($taskPlantX+20), 244, 37, 55)
            }
        }
        $taskBitmap.Save($taskImage.path, [Drawing.Imaging.ImageFormat]::Png)
    } finally { $taskPen.Dispose(); $taskGraphics.Dispose(); $taskBitmap.Dispose() }
}
Write-Output "Generated $($taskManifest.audio.Count) speech WAV files and $($taskManifest.images.Count) original PNG illustrations."
