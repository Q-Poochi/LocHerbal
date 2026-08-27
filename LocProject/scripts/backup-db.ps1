<#
.SYNOPSIS
  Automated PostgreSQL Backup Suite for LocHerbal
.DESCRIPTION
  Dumps database from postgres-primary container with clean/if-exists options, 
  compresses with Gzip, and maintains retention policy (keeps last 7 backups).
#>
param (
    [string]$ContainerName = "postgres-primary",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "postgres_password",
    [string]$DbName = "ecommerce",
    [string]$BackupDir = "",
    [int]$RetentionCount = 7
)

$ErrorActionPreference = "Stop"

if (-not $BackupDir) {
    $BackupDir = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\backups"))
}

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$rawFile = Join-Path $BackupDir "backup_${DbName}_${timestamp}.sql"
$gzFile = "$rawFile.gz"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " [LocHerbal] Starting Database Backup... " -ForegroundColor Cyan
Write-Host " Container : $ContainerName"
Write-Host " Database  : $DbName"
Write-Host " Timestamp : $timestamp"
Write-Host "=========================================="

try {
    # 1. Execute pg_dump inside docker container with clean & if-exists options
    Write-Host "-> Executing pg_dump (--clean --if-exists) in container [$ContainerName]..." -ForegroundColor Yellow
    docker exec -e PGPASSWORD=$DbPassword $ContainerName pg_dump -U $DbUser --clean --if-exists $DbName > $rawFile

    if (-not (Test-Path $rawFile) -or (Get-Item $rawFile).Length -eq 0) {
        throw "Backup dump failed or produced an empty file."
    }

    $rawSizeKB = [math]::Round((Get-Item $rawFile).Length / 1KB, 2)
    Write-Host "-> SQL Dump created: $rawFile ($rawSizeKB KB)" -ForegroundColor Green

    # 2. Compress via .NET GZipStream
    Write-Host "-> Compressing with GZip..." -ForegroundColor Yellow
    $inputStream = [System.IO.File]::OpenRead($rawFile)
    $outputStream = [System.IO.File]::Create($gzFile)
    $gzipStream = New-Object System.IO.Compression.GZipStream($outputStream, [System.IO.Compression.CompressionMode]::Compress)
    $inputStream.CopyTo($gzipStream)
    $gzipStream.Close()
    $outputStream.Close()
    $inputStream.Close()

    # Remove uncompressed raw file
    Remove-Item $rawFile -Force

    $gzSizeKB = [math]::Round((Get-Item $gzFile).Length / 1KB, 2)
    Write-Host "-> Compressed backup saved: $gzFile ($gzSizeKB KB)" -ForegroundColor Green

    # 3. Retention policy: Keep only last N backups
    Write-Host "-> Checking retention policy (Keeping last $RetentionCount backups)..." -ForegroundColor Yellow
    $allBackups = Get-ChildItem -Path $BackupDir -Filter "backup_${DbName}_*.sql.gz" | Sort-Object CreationTime -Descending
    if ($allBackups.Count -gt $RetentionCount) {
        $toDelete = $allBackups | Select-Object -Skip $RetentionCount
        foreach ($old in $toDelete) {
            Write-Host "   - Removing old backup: $($old.Name)" -ForegroundColor DarkGray
            Remove-Item $old.FullName -Force
        }
    }

    # 4. Save metadata
    $meta = @{
        timestamp = $timestamp
        database = $DbName
        container = $ContainerName
        file = (Get-Item $gzFile).Name
        sizeBytes = (Get-Item $gzFile).Length
        createdAt = (Get-Date).ToString("o")
        status = "SUCCESS"
    } | ConvertTo-Json
    $meta | Set-Content -Path (Join-Path $BackupDir "latest-backup.json") -Encoding UTF8

    Write-Host "==========================================" -ForegroundColor Green
    Write-Host " [SUCCESS] Database backup completed! " -ForegroundColor Green
    Write-Host " File: $gzFile ($gzSizeKB KB)" -ForegroundColor Green
    Write-Host "=========================================="
} catch {
    Write-Host " [ERROR] Backup failed: $_" -ForegroundColor Red
    exit 1
}