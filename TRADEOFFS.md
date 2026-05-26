# Tradeoffs

## PDF and OCR are out of scope

The project only accepts structured inputs. That removes a whole class of document parsing work and keeps the prototype centered on ingestion lineage and analyst review rather than OCR quality.

## SAP is modeled through exports, not direct integration

Direct SAP connectivity would require environment-specific credentials, transport details, and mapping agreements. CSV export is a simpler and still believable interface for a prototype focused on downstream data handling.

## Emission factors are local constants

This keeps runs deterministic and avoids pretending that factor governance is solved. A real implementation would likely version factors and separate them from code, but that would add complexity without improving the core workflow demonstrated here.

## Authorization stays intentionally light

The app has registration, JWT login, organization association, and a role field, but it does not attempt a full permission model. That is a deliberate choice to keep the code focused on data handling and review flow rather than identity administration.
