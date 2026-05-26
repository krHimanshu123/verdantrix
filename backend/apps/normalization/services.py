from __future__ import annotations

from decimal import Decimal

from apps.ingestion.models import RawRecord
from apps.organizations.models import Organization
from common.utils import parse_mixed_date, to_decimal

SAP_UNIT_MAP = {
    "L": ("liters", Decimal("1")),
    "Liter": ("liters", Decimal("1")),
    "l": ("liters", Decimal("1")),
    "GAL": ("liters", Decimal("3.78541")),
    "kg": ("kilograms", Decimal("1")),
    "KG": ("kilograms", Decimal("1")),
}

UTILITY_UNIT_MAP = {
    "kwh": ("kwh", Decimal("1")),
    "kWh": ("kwh", Decimal("1")),
    "mwh": ("kwh", Decimal("1000")),
    "MWh": ("kwh", Decimal("1000")),
}

SAP_FUEL_EMISSION_FACTORS = {
    "Diesel": Decimal("0.00268"),
    "Benzin": Decimal("0.00231"),
    "Natural Gas": Decimal("0.00202"),
    "Heizol": Decimal("0.00252"),
}

UTILITY_EMISSION_FACTOR = Decimal("0.00042")

TRAVEL_CLASS_FACTORS = {
    "economy": Decimal("0.00011"),
    "premium_economy": Decimal("0.00014"),
    "business": Decimal("0.00019"),
    "first": Decimal("0.00024"),
    "rail": Decimal("0.00004"),
    "hotel": Decimal("0.03100"),
}

PLANT_LOOKUP = {
    "1000": "Berlin Chemicals Plant",
    "1100": "Hamburg Refining Unit",
    "2100": "Rotterdam Distribution Hub",
    "3100": "Houston Blending Terminal",
}

AIRPORT_DISTANCE_FALLBACKS = {
    ("FRA", "LHR"): Decimal("653"),
    ("JFK", "SFO"): Decimal("4162"),
    ("SIN", "NRT"): Decimal("5312"),
    ("BOM", "DXB"): Decimal("1926"),
    ("ORD", "SEA"): Decimal("2772"),
}


def normalize_sap_row(row: dict, organization: Organization, raw_record: RawRecord) -> dict:
    quantity = to_decimal(row.get("Menge"))
    original_unit = (row.get("Einheit") or "").strip()
    normalized_unit, factor = SAP_UNIT_MAP.get(original_unit, (original_unit.lower(), Decimal("1")))
    normalized_quantity = quantity * factor
    fuel_type = (row.get("Kraftstofftyp") or "Diesel").strip()
    booking_date = parse_mixed_date(row.get("Buchungsdatum"))
    plant_code = (row.get("Werk") or "").strip()
    source_reference = f"{row.get('Buchungskreis', 'NA')}-{plant_code}-{raw_record.row_number}"
    return {
        "organization": organization,
        "raw_record": raw_record,
        "scope_category": "scope_1",
        "emission_category": "stationary_combustion" if fuel_type == "Natural Gas" else "mobile_combustion",
        "activity_type": fuel_type,
        "source_reference": f"{source_reference}:{PLANT_LOOKUP.get(plant_code, 'Unknown Plant')}",
        "quantity": quantity,
        "original_unit": original_unit,
        "normalized_unit": normalized_unit,
        "normalized_quantity": normalized_quantity,
        "emission_factor": SAP_FUEL_EMISSION_FACTORS.get(fuel_type, Decimal("0.00250")),
        "estimated_co2e": normalized_quantity * SAP_FUEL_EMISSION_FACTORS.get(fuel_type, Decimal("0.00250")),
        "reporting_period_start": booking_date,
        "reporting_period_end": booking_date,
        "validation_status": "valid",
        "analyst_status": "pending",
    }


def normalize_utility_row(row: dict, organization: Organization, raw_record: RawRecord) -> dict:
    usage = to_decimal(row.get("kwh_usage"))
    original_unit = (row.get("usage_unit") or row.get("unit") or "kWh").strip()
    normalized_unit, factor = UTILITY_UNIT_MAP.get(original_unit, ("kwh", Decimal("1")))
    normalized_quantity = usage * factor
    return {
        "organization": organization,
        "raw_record": raw_record,
        "scope_category": "scope_2",
        "emission_category": "purchased_electricity",
        "activity_type": "grid_electricity",
        "source_reference": f"{row.get('meter_id', 'UNKNOWN')}-{raw_record.row_number}",
        "quantity": usage,
        "original_unit": original_unit,
        "normalized_unit": normalized_unit,
        "normalized_quantity": normalized_quantity,
        "emission_factor": UTILITY_EMISSION_FACTOR,
        "estimated_co2e": normalized_quantity * UTILITY_EMISSION_FACTOR,
        "reporting_period_start": parse_mixed_date(row.get("billing_start")),
        "reporting_period_end": parse_mixed_date(row.get("billing_end")),
        "validation_status": "valid",
        "analyst_status": "pending",
    }


def normalize_travel_row(row: dict, organization: Organization, raw_record: RawRecord) -> dict:
    booking_type = (row.get("booking_type") or "air").strip().lower()
    travel_class = (row.get("class_of_travel") or "economy").strip().lower().replace(" ", "_")
    if booking_type == "rail":
        travel_class = "rail"

    distance = to_decimal(row.get("distance_km"), default="0")
    if distance == 0:
        distance = AIRPORT_DISTANCE_FALLBACKS.get(
            ((row.get("origin") or "").strip().upper(), (row.get("destination") or "").strip().upper()),
            Decimal("750"),
        )

    booking_date = parse_mixed_date(row.get("booking_date"))
    factor = TRAVEL_CLASS_FACTORS.get(travel_class, Decimal("0.00011"))
    return {
        "organization": organization,
        "raw_record": raw_record,
        "scope_category": "scope_3",
        "emission_category": "business_travel",
        "activity_type": booking_type,
        "source_reference": f"{row.get('employee_id', 'UNKNOWN')}-{row.get('origin', 'NA')}-{row.get('destination', 'NA')}",
        "quantity": distance,
        "original_unit": "km",
        "normalized_unit": "km",
        "normalized_quantity": distance,
        "emission_factor": factor,
        "estimated_co2e": distance * factor,
        "reporting_period_start": booking_date,
        "reporting_period_end": booking_date,
        "validation_status": "valid",
        "analyst_status": "pending",
    }
