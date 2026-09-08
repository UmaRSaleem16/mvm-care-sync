"""
Vendor auto-matching logic.

Given a facility + service_type, find all bookable vendors with coverage
rules for that combination, sorted preferred-first.
"""
from dataclasses import dataclass
from typing import List

from apps.vendors.models import Vendor

from .models import VendorCoverageRule


@dataclass
class MatchResult:
    vendor: Vendor
    is_preferred: bool
    rule_notes: str


def match_vendors(facility_id: str, service_type_id: str) -> List[MatchResult]:
    """
    Return bookable vendors for the given facility + service_type combination.

    Results are ordered: preferred first, then alphabetical.
    """
    rules = (
        VendorCoverageRule.objects
        .filter(
            facility_id=facility_id,
            service_type_id=service_type_id,
            is_active=True,
        )
        .select_related('vendor', 'vendor__service_type')
        .order_by('-is_preferred', 'vendor__name')
    )

    results = []
    for rule in rules:
        vendor = rule.vendor
        if vendor.is_bookable:
            results.append(
                MatchResult(
                    vendor=vendor,
                    is_preferred=rule.is_preferred,
                    rule_notes=rule.notes,
                )
            )
    return results
