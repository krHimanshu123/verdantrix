# Data Model Notes

## Raw and normalized records are separate on purpose

The source row and the analyst-facing record serve different needs:

- `RawRecord` preserves the incoming payload exactly as received
- `NormalizedEmissionRecord` stores the cleaned, comparable record used for validation and review

This keeps lineage explicit and avoids losing source context once data has been transformed.

## Organization is the main tenancy boundary

Users belong to an organization. Data sources, normalized records, and dashboard queries are scoped the same way. That keeps the tenancy model easy to reason about while still feeling like a real internal tool.

## Audit logs attach to normalized records

The main operational object in the application is the normalized record, not the source file. Review notes, approvals, rejections, and locks all happen there, so `AuditLog` is attached at that level.

## Locking is terminal

`locked_for_audit` is treated as a final state. It is simple and matches the goal of showing a clean handoff from analyst review to audit evidence.

## Business logic stays in services

Normalization and review behavior live in service functions instead of model methods. That keeps views thin without introducing extra architectural layers.
