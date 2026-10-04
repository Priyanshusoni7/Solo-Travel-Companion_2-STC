# Starts the backend locally: loads settings from .env, uses the local Redis container
# (docker start stc-redis) and runs Spring Boot on http://localhost:8080.

Set-Location $PSScriptRoot

Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim().Trim('"'), 'Process')
    }
}

$env:SPRING_DATA_REDIS_URL = "redis://localhost:6380"

.\mvnw.cmd spring-boot:run
