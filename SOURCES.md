# Verdantrix Research Notes

The sources below informed how Verdantrix modeled SAP exports, utility billing structures, and travel synchronization payloads. They are not required reading to run the repo; they are here to make the modeling choices easier to justify in review.

## SAP ECC / S4HANA Export Modeling

References:

- SAP Help, field documentation for company code, plant, posting date, and base unit concepts in S/4HANA-style data models:
  - https://help.sap.com
- SAP table references for plant (`WERK`) and company code (`BUKRS`) style semantics:
  - https://www.sapdatasheet.org/abap/tabl/marc-werks.html
  - https://www.sapdatasheet.org/abap/tabl/t001-bukrs.html

What Verdantrix modeled:

- German-language columns such as `Buchungskreis`, `Werk`, `Menge`, `Einheit`, and `Buchungsdatum`
- plant-based operational context
- mixed unit normalization for fuel-oriented activity records
- CSV-style row exports rather than transactional SAP integration

What Verdantrix simplified:

- no SAP material master joins
- no cost center or GL enrichment
- no IDoc, RFC, or OData connectivity

What would fail in real deployment:

- plant mappings would drift without master data governance
- free-text fuel labels would require controlled reference data
- export variants across SAP clients could break hard-coded field assumptions

## Utility Billing Export Modeling

References:

- U.S. EPA ENERGY STAR Portfolio Manager guidance for energy billing period uploads and meter structures:
  - https://portfoliomanager.energystar.gov
- Green Button ecosystem material for interval and billing-style energy data exchange:
  - https://www.greenbuttonalliance.org

What Verdantrix modeled:

- non-calendar billing periods with `billing_start` and `billing_end`
- meter-centric records
- usage, tariff, and total cost fields
- inconsistent units and missing tariff codes

What Verdantrix simplified:

- one record per billing line
- no demand charges, taxes, or time-of-use subcomponents
- no separate account, service address, or supplier dimensions

What would fail in real deployment:

- invoice-level adjustments and corrections could require reversals instead of direct loads
- supplier exports may use locale-specific numeric formats and encodings
- some utilities publish account-level exports rather than meter-level rows

## Concur / Navan Travel API Modeling

References:

- SAP Concur Developer Center and travel itinerary API materials:
  - https://developer.concur.com
- Navan developer and product materials around travel booking workflows:
  - https://developers.navan.com
  - https://navan.com

What Verdantrix modeled:

- employee ID, booking type, origin, destination, class of travel, distance, and booking date
- missing-distance fallback logic for airport-pair estimation
- business travel as a Scope 3 normalization path

What Verdantrix simplified:

- no OAuth credential exchange
- no itinerary segment nesting
- no hotel, car, refund, cancellation, or approval-policy objects

What would fail in real deployment:

- multi-segment itineraries need segment-level emissions rather than one flat trip row
- airport code quality issues would undermine fallback distance logic
- vendor APIs often paginate and evolve faster than static mock payload contracts
