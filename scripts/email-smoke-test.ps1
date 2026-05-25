# Email system smoke test — Emarzona (Supabase + Resend)
# Usage:
#   $env:SUPABASE_URL = "https://hbdnzajbyjakdhuavrvb.supabase.co"
#   $env:SUPABASE_ANON_KEY = "<anon JWT>"
#   $env:CRON_SECRET = "<optional, for cron edge functions>"
#   .\scripts\email-smoke-test.ps1
#
# Or with linked CLI (SQL checks without anon key):
#   .\scripts\email-smoke-test.ps1 -UseSupabaseCli

param(
  [switch]$UseSupabaseCli = $true,
  [string]$TestEmail = "smoke-test-unsub@emarzona.invalid"
)

$ErrorActionPreference = "Continue"
$RepoRoot = if ($PSScriptRoot) { Resolve-Path (Join-Path $PSScriptRoot '..') } else { Get-Location }
$ProjectRef = "hbdnzajbyjakdhuavrvb"
$BaseUrl = $env:SUPABASE_URL
if (-not $BaseUrl) { $BaseUrl = "https://$ProjectRef.supabase.co" }

$passed = 0
$failed = 0
$skipped = 0

function Write-Result($name, $ok, $detail = "") {
  if ($ok) {
    Write-Host "[PASS] $name" -ForegroundColor Green
    if ($detail) { Write-Host "       $detail" -ForegroundColor DarkGray }
    $script:passed++
  } else {
    Write-Host "[FAIL] $name" -ForegroundColor Red
    if ($detail) { Write-Host "       $detail" -ForegroundColor Yellow }
    $script:failed++
  }
}

function Write-Skip($name, $detail) {
  Write-Host "[SKIP] $name - $detail" -ForegroundColor DarkYellow
  $script:skipped++
}

Write-Host "`n=== Emarzona Email Smoke Test ===" -ForegroundColor Cyan
Write-Host "Project: $ProjectRef`n"

# --- 1. SQL via Supabase CLI (linked) ---
if ($UseSupabaseCli) {
  Push-Location $RepoRoot
  $rpcFile = Join-Path $RepoRoot 'supabase\scripts\email-smoke-rpc-check.sql'
  $colsFile = Join-Path $RepoRoot 'supabase\scripts\email-smoke-cols-check.sql'
  $cronFile = Join-Path $RepoRoot 'supabase\scripts\email-smoke-cron-check.sql'

  function Test-SupabaseQueryValue($file, $expected) {
    $lines = @(npx supabase db query --linked -f $file -o csv 2>&1 | ForEach-Object { "$_" })
    return ($lines | Where-Object { $_.Trim() -eq $expected }).Count -gt 0
  }

  Write-Result 'SQL: record_email_unsubscribe RPC' (Test-SupabaseQueryValue $rpcFile 'true')
  Write-Result 'SQL: email_logs columns to_email+status' (Test-SupabaseQueryValue $colsFile '2')
  Write-Result 'SQL: email crons active 3 jobs' (Test-SupabaseQueryValue $cronFile '3')

  Pop-Location
} else {
  Write-Skip "SQL checks" "Use -UseSupabaseCli or run supabase/scripts/email-smoke-verify.sql"
}

# --- 2. Anon RPC unsubscribe (public page) ---
$anonKey = $env:SUPABASE_ANON_KEY
if ($anonKey) {
  $body = @{
    p_email            = $TestEmail
    p_unsubscribe_type = "marketing"
    p_reason           = "smoke-test"
  } | ConvertTo-Json

  try {
    $resp = Invoke-RestMethod -Method Post `
      -Uri "$BaseUrl/rest/v1/rpc/record_email_unsubscribe" `
      -Headers @{
        apikey        = $anonKey
        Authorization = "Bearer $anonKey"
        "Content-Type" = "application/json"
      } `
      -Body $body

    Write-Result "REST: anon record_email_unsubscribe" $true $TestEmail
  } catch {
    $msg = $_.ErrorDetails.Message
    if (-not $msg) { $msg = $_.Exception.Message }
    Write-Result "REST: anon record_email_unsubscribe" $false $msg
  }

  try {
    $check = Invoke-RestMethod -Method Post `
      -Uri "$BaseUrl/rest/v1/rpc/check_user_unsubscribed" `
      -Headers @{
        apikey        = $anonKey
        Authorization = "Bearer $anonKey"
        "Content-Type" = "application/json"
      } `
      -Body (@{ p_email = $TestEmail; p_type = "marketing" } | ConvertTo-Json)

    $checkOk = ($check -eq $true)
    Write-Result 'REST: check_user_unsubscribed marketing' $checkOk "returned=$check"
  } catch {
    Write-Result "REST: check_user_unsubscribed" $false $_.Exception.Message
  }
} else {
  Write-Skip 'REST anon RPC tests' 'Set SUPABASE_ANON_KEY from Dashboard API anon JWT'
}

# --- 3. Edge Functions (cron + health) ---
$cronSecret = $env:CRON_SECRET
$edgeTests = @(
  @{ Name = "process-scheduled-campaigns"; Path = "process-scheduled-campaigns"; Body = "{}" },
  @{ Name = "process-email-sequences"; Path = "process-email-sequences"; Body = "{}" }
)

foreach ($t in $edgeTests) {
  if (-not $cronSecret) {
    Write-Skip "Edge: $($t.Name)" "Set CRON_SECRET"
    continue
  }
  try {
    $r = Invoke-WebRequest -Method Post `
      -Uri "$BaseUrl/functions/v1/$($t.Path)" `
      -Headers @{
        "x-cron-secret"  = $cronSecret
        "Content-Type"   = "application/json"
      } `
      -Body $t.Body `
      -UseBasicParsing `
      -TimeoutSec 60
    $ok = $r.StatusCode -ge 200 -and $r.StatusCode -lt 300
    Write-Result "Edge: $($t.Name)" $ok "HTTP $($r.StatusCode)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Result "Edge: $($t.Name)" $false "HTTP $code - $($_.Exception.Message)"
  }
}

# resend-webhook: deployed if not 404 (POST without signature -> 401/400 expected)
try {
  $wh = Invoke-WebRequest -Method Post `
    -Uri "$BaseUrl/functions/v1/resend-webhook-handler" `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body "{}" `
    -UseBasicParsing -TimeoutSec 15
  $whOk = $wh.StatusCode -ge 200 -and $wh.StatusCode -lt 500
  Write-Result 'Edge: resend-webhook-handler deployed' $whOk "HTTP $($wh.StatusCode)"
} catch {
  $code = 0
  if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
  $whOk = ($code -eq 401) -or ($code -eq 400) -or ($code -eq 403) -or ($code -eq 405)
  Write-Result 'Edge: resend-webhook-handler deployed' $whOk "HTTP $code (auth/signature expected)"
}

# --- Summary ---
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed  Failed: $failed  Skipped: $skipped"
if ($failed -gt 0) { exit 1 }
exit 0
