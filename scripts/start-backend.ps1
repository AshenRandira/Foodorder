$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $repositoryRoot '.env'

if (-not (Test-Path -LiteralPath $environmentFile)) {
    throw 'Root .env is missing. Copy .env.example to .env and configure it first.'
}

$allowedVariables = @(
    'POSTGRES_DB',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_PORT',
    'DB_POOL_MAX_SIZE',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'SESSION_COOKIE_SECURE',
    'SESSION_COOKIE_SAME_SITE',
    'FRONTEND_ORIGINS',
    'PAYHERE_ENABLED',
    'PAYHERE_MERCHANT_ID',
    'PAYHERE_MERCHANT_SECRET',
    'PAYHERE_CHECKOUT_URL',
    'PAYHERE_NOTIFY_URL',
    'PAYHERE_RETURN_URL',
    'PAYHERE_CANCEL_URL',
    'WHATSAPP_BUSINESS_NUMBER',
    'DELIVERY_FEE_LKR'
)

foreach ($line in Get-Content -LiteralPath $environmentFile) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) {
        continue
    }

    $parts = $trimmed -split '=', 2
    if ($parts.Count -ne 2) {
        continue
    }

    $name = $parts[0].Trim()
    if ($name -notin $allowedVariables) {
        continue
    }

    $value = $parts[1].Trim()
    if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
        $value = $value.Substring(1, $value.Length - 2)
    }

    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
}

foreach ($requiredVariable in @('POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD')) {
    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($requiredVariable, 'Process'))) {
        throw "$requiredVariable must be present in the root .env file."
    }
}

$databaseName = [Environment]::GetEnvironmentVariable('POSTGRES_DB', 'Process')
$databaseUsername = [Environment]::GetEnvironmentVariable('POSTGRES_USER', 'Process')
$databasePassword = [Environment]::GetEnvironmentVariable('POSTGRES_PASSWORD', 'Process')
$databasePort = [Environment]::GetEnvironmentVariable('POSTGRES_PORT', 'Process')
if ([string]::IsNullOrWhiteSpace($databasePort)) {
    $databasePort = '5432'
}
[Environment]::SetEnvironmentVariable('DB_URL', "jdbc:postgresql://localhost:$databasePort/$databaseName", 'Process')
[Environment]::SetEnvironmentVariable('DB_USERNAME', $databaseUsername, 'Process')
[Environment]::SetEnvironmentVariable('DB_PASSWORD', $databasePassword, 'Process')

Push-Location (Join-Path $repositoryRoot 'backend')
try {
    & mvn spring-boot:run
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}
