# Lit CRON_SECRET depuis $env:CRON_SECRET ou scripts/.cron-secret.local (gitignored via *.local)

param(
  [string]$SecretFile = (Join-Path $PSScriptRoot '.cron-secret.local')
)

if ($env:CRON_SECRET) {
  return $env:CRON_SECRET.Trim()
}

if (Test-Path $SecretFile) {
  return (Get-Content $SecretFile -Raw).Trim()
}

return $null
