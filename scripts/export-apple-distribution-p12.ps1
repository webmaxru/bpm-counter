param(
  [Parameter(Mandatory = $true)]
  [string]$CertificatePath,
  [string]$SigningDirectory = (Join-Path $PSScriptRoot "..\ios\signing-private"),
  [string]$FriendlyName = "Apple Distribution",
  [string]$OutputFileName = "apple-distribution.p12"
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

$SigningDirectory = [IO.Path]::GetFullPath($SigningDirectory)
$PrivateKeyPath = Join-Path $SigningDirectory "apple-distribution-private.key"
$PemPath = Join-Path $SigningDirectory "apple-distribution-certificate.pem"
$P12Path = Join-Path $SigningDirectory $OutputFileName

if (-not (Test-Path -LiteralPath $CertificatePath)) {
  throw "Apple certificate not found: $CertificatePath"
}
if (-not (Test-Path -LiteralPath $PrivateKeyPath)) {
  throw "Private key not found: $PrivateKeyPath"
}
if (Test-Path -LiteralPath $P12Path) {
  throw "The output already exists: $P12Path"
}

& $OpenSslPath x509 `
  -inform DER `
  -in $CertificatePath `
  -outform PEM `
  -out $PemPath
if ($LASTEXITCODE -ne 0) {
  throw "OpenSSL could not convert the Apple certificate."
}

$CertificateModulus = & $OpenSslPath x509 -noout -modulus -in $PemPath
$PrivateKeyModulus = & $OpenSslPath rsa -noout -modulus -in $PrivateKeyPath
if ($CertificateModulus -ne $PrivateKeyModulus) {
  throw "The downloaded certificate does not match the private key used for the CSR."
}

Write-Host "Choose a strong export password. You will save the same value in IOS_CERTIFICATE_PASSWORD."
& $OpenSslPath pkcs12 `
  -export `
  -inkey $PrivateKeyPath `
  -in $PemPath `
  -name $FriendlyName `
  -out $P12Path
if ($LASTEXITCODE -ne 0) {
  throw "OpenSSL could not export the PKCS#12 certificate."
}

Write-Host ""
Write-Host "GitHub Actions certificate ready:"
Write-Host "  $P12Path"
Write-Host ""
Write-Warning "Keep the .p12, its password, and the private key secret."
