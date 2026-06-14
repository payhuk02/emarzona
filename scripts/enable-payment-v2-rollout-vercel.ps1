# Active le rollout canary Payment V2 sur Vercel (production).
# Prerequis : VERCEL_TOKEN (Dashboard -> Settings -> Tokens) ou `npx vercel login`
#
# Usage :
#   $env:VERCEL_TOKEN = "<token>"
#   .\scripts\enable-payment-v2-rollout-vercel.ps1 -RolloutPercent 50
#   .\scripts\enable-payment-v2-rollout-vercel.ps1 -RolloutPercent 50 -Redeploy

param(
  [ValidateRange(0, 100)]
  [int]$RolloutPercent = 10,
  [switch]$Redeploy,
  [switch]$SkipRedeploy
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent

function Get-VercelCliArgs {
  $cliArgs = @('--yes', 'vercel@latest')
  if ($env:VERCEL_TOKEN) {
    $cliArgs += @('--token', $env:VERCEL_TOKEN)
  }
  return $cliArgs
}

function Invoke-VercelCli {
  param([string[]]$VercelSubArgs)
  $all = @(Get-VercelCliArgs) + $VercelSubArgs
  & npx @all
  if ($LASTEXITCODE -ne 0) {
    throw "vercel $($VercelSubArgs -join ' ') failed (exit $LASTEXITCODE)"
  }
}

function Set-VercelEnvValue {
  param(
    [string]$Name,
    [string]$Value
  )
  Invoke-VercelCli @('env', 'add', $Name, 'production', '--value', $Value, '--yes', '--force')
}

if (-not $env:VERCEL_TOKEN) {
  Write-Host 'VERCEL_TOKEN non defini - tentative via session CLI (vercel login)...'
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $whoami = & npx --yes vercel@latest whoami 2>&1 | Out-String
  $whoamiExit = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
  if ($whoamiExit -ne 0) {
    Write-Error @'
VERCEL_TOKEN manquant et CLI non authentifiee.
  $env:VERCEL_TOKEN = "<token>"   # https://vercel.com/account/tokens
  ou : npx vercel login
'@
  }
  Write-Host "Vercel CLI : $($whoami.Trim())"
}

Push-Location $Root
try {
  Write-Host "Production - VITE_PAYMENT_ORCHESTRATION_V2=true"
  Set-VercelEnvValue -Name 'VITE_PAYMENT_ORCHESTRATION_V2' -Value 'true'

  Write-Host "Production - VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT=$RolloutPercent"
  Set-VercelEnvValue -Name 'VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT' -Value "$RolloutPercent"

  Write-Host ''
  Write-Host 'Variables production :'
  Invoke-VercelCli @('env', 'ls', 'production') | Select-String 'VITE_PAYMENT_ORCHESTRATION'

  if ($Redeploy -and -not $SkipRedeploy) {
    Write-Host ''
    Write-Host 'Redeploiement production (--archive=tgz pour limiter les uploads)...'
    try {
      Invoke-VercelCli @('deploy', '--prod', '--archive=tgz')
    }
    catch {
      Write-Warning $_.Exception.Message
      Write-Host ''
      Write-Host 'Si quota api-upload-free depasse : redeployez depuis Vercel Dashboard'
      Write-Host '  -> Project emarzona -> Deployments -> Redeploy (production)'
      Write-Host 'Les VITE_* sont deja enregistrees ; un redeploy build est requis pour les activer.'
    }
  }
  else {
    Write-Host ''
    Write-Host 'Redeployez production pour appliquer les VITE_* au build :'
    Write-Host '  Vercel Dashboard -> Deployments -> Redeploy (production)'
    Write-Host '  ou : npx vercel deploy --prod --archive=tgz'
  }
}
finally {
  Pop-Location
}
