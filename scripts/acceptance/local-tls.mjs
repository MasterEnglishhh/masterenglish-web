import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, X509Certificate } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** Local acceptance CA only; never installs a trust root into the operating system. */
export function ensureLocalTls(directory = resolve(".audit/runtime/tls")) {
  directory = resolve(directory);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const caPath = join(directory, "ca.pem");
  const caKey = join(directory, "ca-key.pem");
  const certPath = join(directory, "server.pem");
  const keyPath = join(directory, "server-key.pem");
  if (![caPath, caKey, certPath, keyPath].every(existsSync)) {
    const gitOpenSsl = "C:/Program Files/Git/usr/bin/openssl.exe";
    const openssl = existsSync(gitOpenSsl) ? gitOpenSsl : "openssl";
    const run = (...args) =>
      execFileSync(openssl, args, { stdio: "pipe", windowsHide: true });
    if (!existsSync(caPath) || !existsSync(caKey)) {
      run(
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-keyout",
        caKey,
        "-out",
        caPath,
        "-days",
        "30",
        "-subj",
        "/CN=MasterEnglish local acceptance CA",
        "-addext",
        "basicConstraints=critical,CA:TRUE",
        "-addext",
        "keyUsage=critical,keyCertSign,cRLSign"
      );
    }
    const csrPath = join(directory, "server.csr");
    const extensions = join(directory, "server.ext");
    writeFileSync(
      extensions,
      "subjectAltName=DNS:localhost,IP:127.0.0.1\nextendedKeyUsage=serverAuth\nkeyUsage=digitalSignature,keyEncipherment\nbasicConstraints=CA:FALSE\n"
    );
    run(
      "req",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      keyPath,
      "-out",
      csrPath,
      "-subj",
      "/CN=localhost"
    );
    run(
      "x509",
      "-req",
      "-in",
      csrPath,
      "-CA",
      caPath,
      "-CAkey",
      caKey,
      "-CAcreateserial",
      "-out",
      certPath,
      "-days",
      "30",
      "-sha256",
      "-extfile",
      extensions
    );
  }
  const ca = new X509Certificate(readFileSync(caPath));
  const certificate = new X509Certificate(readFileSync(certPath));
  assert(
    ca.ca && certificate.verify(ca.publicKey),
    "Local leaf must be signed by the acceptance CA"
  );
  assert.equal(certificate.checkHost("localhost"), "localhost");
  assert.equal(certificate.checkIP("127.0.0.1"), "127.0.0.1");
  assert(
    Date.parse(certificate.validTo) > Date.now(),
    "Local certificate expired; remove .audit/runtime/tls and regenerate"
  );
  const metadata = {
    caPath,
    certPath,
    keyPath,
    spkiSha256: createHash("sha256")
      .update(certificate.publicKey.export({ type: "spki", format: "der" }))
      .digest("base64"),
    validTo: certificate.validTo,
  };
  writeFileSync(
    join(directory, "metadata.json"),
    JSON.stringify(metadata, null, 2) + "\n"
  );
  return metadata;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  console.log(JSON.stringify(ensureLocalTls(), null, 2));
}
