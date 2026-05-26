# Engineering Decisions

## Why CSV instead of PDF

CSV keeps the ingestion path deterministic and reviewable. The goal here is row-level lineage, normalization, and review controls. PDF support would shift effort toward OCR and layout recovery, which are real problems but not the focus of this repo.

## Why MySQL

MySQL fits the scope without adding complexity:

- it is common in internal business applications
- Django supports it well
- the schema is mostly relational
- JSON columns are enough for preserved raw payloads

There was no reason to introduce a more specialized data store for this scope.

## Why the travel sync is mocked

Travel is modeled as an API-style sync because that is a believable input shape, but the payload is mocked locally. This keeps the repo focused on normalization, anomaly handling, review, and audit history instead of OAuth and third‑party account management.

## Why locking matters

The lock step makes the review workflow credible. In a real reporting flow, some records eventually need to stop changing so they can be referenced in audit support or downstream reporting. Treating lock as terminal is a simple way to model that control.

## Why raw data is immutable

`RawRecord` is intentionally append-only. If a normalization rule changes or a reviewer questions a result, the system still has the exact source row that produced it. That is more useful for this project than trying to treat normalized data as the sole source of truth.

## Practical assumptions

- users belong to one organization
- roles are lightweight: analyst or manager
- emission factors are embedded constants
- sample data is curated for local testing rather than external accuracy

## Open questions for a larger build

- should locked records support a supervised reopen flow
- should duplicate detection be scoped more narrowly by source type
- should emission factors become organization-specific or time-versioned
- should file storage move from request payloads to durable blob storage
