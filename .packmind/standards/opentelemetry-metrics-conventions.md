# OpenTelemetry metrics conventions

How to define and report application metrics in sync-service so they query cleanly in Prometheus and Grafana.

## Scope

**/src/main/kotlin/**/*.kt

## Rules

* Name metrics in snake_case, for example `event_router_lag`, never CamelCase
* Report event counts with a Counter and unit `{event}` instead of reporting a rate
* Calculate rates at query time in Grafana, not in application code
* Use a Gauge for point-in-time values such as lag, not a Histogram
* Use a Histogram only when the distribution of values is needed
* Report metrics at an interval of 1 minute unless a different interval is documented
* Obtain the meter through `getMeterBuilder()` in `Common.kt`
* Rely on the resource-level stage attribute instead of adding a stage attribute to individual metrics
* Set a unit with `setUnit` on every instrument
