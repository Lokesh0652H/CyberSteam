param(
    [ValidateRange(1, 100000000)]
    [int]$Rows = 1000000,
    [int]$Days = 30,
    [int]$Seed = 42
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

docker compose --profile bda up -d --build
if ($LASTEXITCODE -ne 0) {
    throw "Could not start the CyberStream BDA services."
}

Write-Host "Waiting for HDFS and HiveServer2..."
$hdfsReady = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    docker compose exec -T namenode hdfs dfs -test -d / 2>$null
    if ($LASTEXITCODE -eq 0) {
        $hdfsReady = $true
        break
    }
    Start-Sleep -Seconds 3
}
if (-not $hdfsReady) {
    throw "HDFS did not become ready. Inspect docker compose logs namenode datanode."
}

$hiveReady = $false
for ($attempt = 0; $attempt -lt 40; $attempt++) {
    docker compose exec -T hive beeline `
        -u "jdbc:hive2://localhost:10000/default" `
        --silent=true `
        -e "SELECT 1" *> $null
    if ($LASTEXITCODE -eq 0) {
        $hiveReady = $true
        break
    }
    Start-Sleep -Seconds 3
}
if (-not $hiveReady) {
    throw "HiveServer2 did not become ready. Inspect docker compose logs hive."
}

python --version
if ($LASTEXITCODE -ne 0) {
    throw "Python 3 is required to generate the synthetic dataset."
}
python bda/generate_dataset.py --rows $Rows --days $Days --seed $Seed
if ($LASTEXITCODE -ne 0) {
    throw "Synthetic dataset generation failed."
}

docker compose run --rm --no-deps spark spark-submit /opt/streaming/spark/jobs/batch_job.py
if ($LASTEXITCODE -ne 0) {
    throw "Spark batch processing failed. Check the Spark and HDFS logs."
}

docker compose exec -T hive beeline `
    -u "jdbc:hive2://localhost:10000/default" `
    --silent=true `
    -f /opt/bda/hive/queries/create_tables.hql
if ($LASTEXITCODE -ne 0) {
    throw "Hive table setup failed. Check HiveServer2 and HDFS logs."
}

& (Join-Path $PSScriptRoot "run-hive-analytics.ps1")
if ($LASTEXITCODE -ne 0) {
    throw "HiveQL analytics export failed."
}

docker compose exec -T rstudio Rscript /home/rstudio/bda/analysis.R
if ($LASTEXITCODE -ne 0) {
    throw "RStudio chart generation failed."
}

Write-Host "BDA workflow complete. Hive CSV exports and R charts are in data/bda/results."
Write-Host "Open RStudio at http://localhost:8787 (user: rstudio)."
