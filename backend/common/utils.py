from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Iterable

from django.utils import timezone


DATE_FORMATS = [
    "%Y-%m-%d",
    "%d.%m.%Y",
    "%d/%m/%Y",
    "%m/%d/%Y",
    "%Y/%m/%d",
    "%d-%m-%Y",
]


def parse_mixed_date(value):
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        return value.date()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(str(value).strip(), fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Unsupported date format: {value}")


def to_decimal(value, default="0"):
    cleaned = str(value).strip().replace(",", "")
    if cleaned == "":
        cleaned = default
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return Decimal(default)


def is_future_date(value):
    if value is None:
        return False
    return value > timezone.now().date()


def average(values: Iterable[Decimal]) -> Decimal:
    values = list(values)
    if not values:
        return Decimal("0")
    return sum(values) / Decimal(len(values))


def user_organization_id(user) -> int | None:
    return getattr(user, "organization_id", None)
