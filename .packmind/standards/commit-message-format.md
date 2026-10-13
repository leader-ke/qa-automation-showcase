# Commit message format

Commit and pull request titles follow one format so history stays searchable and traceable to a ticket.

## Rules

* Format commit subjects as `<emoji> <Component>: <summary> - <TICKET>`, for example `✨ Telemetry: Add event router lag - FUNZA-4694`
* Reference the real ticket ID in every commit, and avoid `NO-TICKET` when a ticket exists
* Squash review fixups into the commit they fix before merging
* Write pull request titles in the same format as commit subjects
* Keep the commit subject under 100 characters
