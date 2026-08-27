<#
.SYNOPSIS
  Automated PostgreSQL Restore Suite for LocHerbal
.DESCRIPTION
  Decompresses a .sql.gz backup and restores it to the postgres-primary container.
#>
param (
    [Parameter(Mandatory=$false)]
    [string]$BackupFile,
    [string]$ContainerName = "postgres-primary",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "postgres_password",
    [string]$DbName = "ecommerce",
    [string]$BackupDir = ""
)

$ErrorActionPreference = "Stop"

if (-not $BackupDir) {
    $BackupDir = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\backups"))
}

if (-not $BackupFile) {
    # Pick the latest backup file automatically if none specified
    $latest = Get-ChildItem -Path $BackupDir -Filter "backup_${DbName}_*.sql.gz" | Sort-Object CreationTime -Descending | Select-Object -First 1
    if (-not $latest) {
        throw "No backup file found in $BackupDir"
    }
    $BackupFile = $latest.FullName
}

if (-not (Test-Path $BackupFile)) {
    throw "Backup file not found: $BackupFile"
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " [LocHerbal] Database Restore Process " -ForegroundColor Cyan
Write-Host " Container   : $ContainerName"
Write-Host " Database    : $DbName"
Write-Host " Source File : $BackupFile"
Write-Host "=========================================="

try {
    $tempSql = [System.IO.Path]::ChangeExtension($BackupFile, ".temp.sql")
    
    if ($BackupFile.EndsWith(".gz")) {
        Write-Host "-> Decompressing backup file..." -ForegroundColor Yellow
        $inputStream = [System.IO.File]::OpenRead($BackupFile)
        $gzipStream = New-Object System.IO.Compression.GZipStream($inputStream, [System.IO.Compression.CompressionMode]::Decompress)
        $outputStream = [System.IO.File]::Create($tempSql)
        $gzipStream.CopyTo($outputStream)
        $outputStream.Close()
        $gzipStream.Close()
        $inputStream.Close()
    } else {
        $tempSql = $BackupFile
    }

    Write-Host "-> Restoring SQL to container [$ContainerName]..." -ForegroundColor Yellow
    Get-Content $tempSql -Encoding UTF8 | docker exec -i -e PGPASSWORD=$DbPassword $ContainerName psql -U $DbUser $DbName

    if ($tempSql.EndsWith(".temp.sql") -and (Test-Path $tempSql)) {
        Remove-Item $tempSql -Force
    }

    Write-Host "==========================================" -ForegroundColor Green
    Write-Host " [SUCCESS] Database restored successfully!" -ForegroundColor Green
    Write-Host "=========================================="
} catch {
    Write-Host " [ERROR] Restore failed: $_" -ForegroundColor Red
    if (Test-Path $tempSql) { Remove-Item $tempSql -Force }
    exit 1
}