param(
    [string]$ResultsDirectory = "data/bda/results"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$resolvedResultsDirectory = Join-Path $projectRoot $ResultsDirectory
New-Item -ItemType Directory -Force -Path $resolvedResultsDirectory | Out-Null

$repair = "USE cyberstream; MSCK REPAIR TABLE cyber_events_batch; MSCK REPAIR TABLE cyber_events_stream;"
& docker compose exec -T hive beeline -u "jdbc:hive2://localhost:10000/default" --silent=true -e $repair
if ($LASTEXITCODE -ne 0) {
    throw "Could not connect to HiveServer2 or refresh its HDFS partitions."
}

$queries = [ordered]@{
    "events_by_severity.csv" = "SELECT severity, COUNT(1) AS total_events FROM cyberstream.cyber_events_all GROUP BY severity ORDER BY total_events DESC"
    "events_by_hour.csv" = "SELECT substr(``timestamp``, 1, 13) AS hour_utc, COUNT(1) AS total_events FROM cyberstream.cyber_events_all GROUP BY substr(``timestamp``, 1, 13) ORDER BY hour_utc"
    "top_sources.csv" = "SELECT source_ip, COUNT(1) AS failed_attempts FROM cyberstream.cyber_events_all WHERE event_type IN ('authentication', 'ssh') AND action = 'failed' GROUP BY source_ip ORDER BY failed_attempts DESC LIMIT 10"
    "events_by_type.csv" = "SELECT event_type, COUNT(1) AS total_events FROM cyberstream.cyber_events_all GROUP BY event_type ORDER BY total_events DESC"
}

foreach ($entry in $queries.GetEnumerator()) {
    $output = & docker compose exec -T hive beeline `
        -u "jdbc:hive2://localhost:10000/default" `
        --silent=true `
        --showHeader=true `
        --outputformat=csv2 `
        -e $entry.Value
    if ($LASTEXITCODE -ne 0) {
        throw "HiveQL export failed: $($entry.Key)"
    }
    $outputPath = Join-Path $resolvedResultsDirectory $entry.Key
    [System.IO.File]::WriteAllLines(
        $outputPath,
        [string[]]$output,
        [System.Text.UTF8Encoding]::new($false)
    )
    Write-Host "Wrote $outputPath"
}
