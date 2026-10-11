results_dir <- Sys.getenv("CYBERSTREAM_RESULTS", "/home/rstudio/results")
dir.create(results_dir, recursive = TRUE, showWarnings = FALSE)

read_result <- function(file_name) {
  path <- file.path(results_dir, file_name)
  if (!file.exists(path)) {
    stop(sprintf("Missing Hive export %s. Run scripts/run-hive-analytics.ps1 first.", path))
  }
  read.csv(path, check.names = FALSE, stringsAsFactors = FALSE)
}

severity <- read_result("events_by_severity.csv")
hourly <- read_result("events_by_hour.csv")
sources <- read_result("top_sources.csv")
types <- read_result("events_by_type.csv")

png(file.path(results_dir, "events_by_severity.png"), width = 1200, height = 750)
barplot(
  severity$total_events,
  names.arg = severity$severity,
  col = "steelblue",
  main = "Cyber Events by Severity",
  xlab = "Severity",
  ylab = "Number of events",
  las = 1
)
dev.off()

png(file.path(results_dir, "events_by_hour.png"), width = 1400, height = 750)
plot(
  seq_len(nrow(hourly)),
  hourly$total_events,
  type = "l",
  col = "firebrick",
  lwd = 2,
  xaxt = "n",
  main = "Cyber Events per Hour (UTC)",
  xlab = "Hour",
  ylab = "Number of events"
)
axis(1, at = seq_len(nrow(hourly)), labels = hourly$hour_utc, las = 2, cex.axis = 0.65)
dev.off()

png(file.path(results_dir, "top_sources.png"), width = 1200, height = 750)
barplot(
  sources$failed_attempts,
  names.arg = sources$source_ip,
  col = "darkorange",
  main = "Top 10 Sources by Failed Authentication/SSH Attempts",
  xlab = "Source IP",
  ylab = "Failed attempts",
  las = 2
)
dev.off()

png(file.path(results_dir, "events_by_type.png"), width = 1200, height = 750)
barplot(
  types$total_events,
  names.arg = types$event_type,
  col = "seagreen",
  main = "Cyber Events by Event Type",
  xlab = "Event type",
  ylab = "Number of events",
  las = 2
)
dev.off()

png(file.path(results_dir, "bda_architecture.png"), width = 1600, height = 700)
par(mar = c(1, 1, 3, 1))
plot.new()
plot.window(xlim = c(0, 8), ylim = c(0, 2), asp = 1)
title("CyberStream Big Data Analytics Architecture")
labels <- c("Synthetic\nGenerator", "Kafka\nStreaming", "Spark\nProcessing",
            "HDFS\nParquet", "HiveQL\nAnalytics", "RStudio\nVisuals")
for (index in seq_along(labels)) {
  x <- index - 0.5
  rect(x - 0.42, 0.78, x + 0.42, 1.22, col = "lightblue", border = "steelblue", lwd = 2)
  text(x, 1, labels[index], cex = 0.9)
  if (index < length(labels)) {
    arrows(x + 0.43, 1, x + 0.57, 1, length = 0.12, lwd = 2, col = "gray30")
  }
}
dev.off()

cat("Saved five charts to", results_dir, "\n")
