<!-- start: Packmind standards -->
# Packmind Standards

Before starting your work, make sure to review the coding standards relevant to your current task.

Always consult the sections that apply to the technology, framework, or type of contribution you are working on.

All rules and guidelines defined in these standards are mandatory and must be followed consistently.

Failure to follow these standards may lead to inconsistencies, errors, or rework. Treat them as the source of truth for how code should be written, structured, and maintained.

# Standard: Commit message format

Commit and pull request titles follow one format so history stays searchable and traceable to a ticket. :
* Format commit subjects as `<emoji> <Component>: <summary> - <TICKET>`, for example `✨ Telemetry: Add event router lag - FUNZA-4694`
* Keep the commit subject under 100 characters
* Reference the real ticket ID in every commit, and avoid `NO-TICKET` when a ticket exists
* Squash review fixups into the commit they fix before merging
* Write pull request titles in the same format as commit subjects

Full standard is available here for further request: [Commit message format](.packmind/standards/commit-message-format.md)

# Standard: Helm and helmfile per-stage configuration

Chart defaults must be safe for test and temporary stages. Prod-only behaviour is configured in helmfile. :
* Avoid changing existing defaults in `values.yaml` to suit prod
* Document any prod-only override with a one-line reason in the helmfile
* Expose scheduling and scaling settings as values instead of hardcoding them in templates
* Keep chart defaults in `values.yaml` conservative and identical for every stage
* Pair `whenUnsatisfiable: DoNotSchedule` with `nodeTaintsPolicy: Honor`, and enable it on prod only
* Render the chart for the test stage and for prod before finishing, and confirm test output is unchanged
* Set prod-only values in `helmfile.yaml.gotmpl` inside an `$isProd` condition

Full standard is available here for further request: [Helm and helmfile per-stage configuration](.packmind/standards/helm-and-helmfile-per-stage-configuration.md)

# Standard: OpenTelemetry metrics conventions

How to define and report application metrics in sync-service so they query cleanly in Prometheus and Grafana. :
* Calculate rates at query time in Grafana, not in application code
* Name metrics in snake_case, for example `event_router_lag`, never CamelCase
* Obtain the meter through `getMeterBuilder()` in `Common.kt`
* Rely on the resource-level stage attribute instead of adding a stage attribute to individual metrics
* Report event counts with a Counter and unit `{event}` instead of reporting a rate
* Report metrics at an interval of 1 minute unless a different interval is documented
* Set a unit with `setUnit` on every instrument
* Use a Gauge for point-in-time values such as lag, not a Histogram
* Use a Histogram only when the distribution of values is needed

Full standard is available here for further request: [OpenTelemetry metrics conventions](.packmind/standards/opentelemetry-metrics-conventions.md)
<!-- end: Packmind standards -->