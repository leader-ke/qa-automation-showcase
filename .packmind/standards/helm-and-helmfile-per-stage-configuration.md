# Helm and helmfile per-stage configuration

Chart defaults must be safe for test and temporary stages. Prod-only behaviour is configured in helmfile.

## Scope

**/src/main/helm/**, **/helmfile.yaml.gotmpl

## Rules

* Keep chart defaults in `values.yaml` conservative and identical for every stage
* Set prod-only values in `helmfile.yaml.gotmpl` inside an `$isProd` condition
* Expose scheduling and scaling settings as values instead of hardcoding them in templates
* Avoid changing existing defaults in `values.yaml` to suit prod
* Render the chart for the test stage and for prod before finishing, and confirm test output is unchanged
* Pair `whenUnsatisfiable: DoNotSchedule` with `nodeTaintsPolicy: Honor`, and enable it on prod only
* Document any prod-only override with a one-line reason in the helmfile
