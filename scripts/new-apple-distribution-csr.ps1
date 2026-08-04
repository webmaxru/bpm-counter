param(
  [string]$CommonName = "Maxim Salnikov",
  [string]$CountryCode = "NO",
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\ios\signing-private")
)

$ErrorActionPreference = "Stop"

$OpenSsl = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $OpenSsl) {
  $GitOpenSsl = "C:\Program Files\Git\usr\bin\openssl.exe"
  if (-not (Test-Path -LiteralPath $GitOpenSsl)) {
    throw "OpenSSL was not found. Install Git for Windows or add openssl.exe to PATH."
  }
  $OpenSslPath = $GitOpenSsl
} else {
  $OpenSslPath = $OpenSsl.Source
}

$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
$PrivateKeyPath = Join-Path $OutputDirectory "apple-distribution-private.key"
$CsrPath = Join-Path $OutputDirectory "CertificateSigningRequest.certSigningRequest"

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

if ((Test-Path -LiteralPath $PrivateKeyPath) -or (Test-Path -LiteralPath $CsrPath)) {
  throw "Signing files already exist in $OutputDirectory. Move or back them up before generating a new identity."
}

& $OpenSslPath genrsa -out $PrivateKeyPath 2048
if ($LASTEXITCODE -ne 0) {
  throw "OpenSSL failed to generate the private key."
}

& $OpenSslPath req `
  -new `
  -sha256 `
  -key $PrivateKeyPath `
  -out $CsrPath `
  -subj "/CN=$CommonName/C=$CountryCode"
if ($LASTEXITCODE -ne 0) {
  throw "OpenSSL failed to generate the certificate signing request."
}

& $OpenSslPath req -in $CsrPath -noout -verify
if ($LASTEXITCODE -ne 0) {
  throw "The generated certificate signing request could not be verified."
}

Write-Host ""
Write-Host "CSR ready for Apple:"
Write-Host "  $CsrPath"
Write-Host ""
Write-Warning "Keep this private key secret and backed up:"
Write-Warning "  $PrivateKeyPath"
