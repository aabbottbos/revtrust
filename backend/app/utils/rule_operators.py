"""
Rule operators for evaluating business rules against deal data.
Implements all operators defined in business-rules.yaml
"""
from datetime import datetime, timedelta
from typing import Any, Optional


def is_empty(value: Any) -> bool:
    """Field is null, empty string, or whitespace only"""
    if value is None:
        return True
    if isinstance(value, str):
        return len(value.strip()) == 0
    return False


def is_null_or_zero(value: Any) -> bool:
    """Field is null or equals zero"""
    if value is None:
        return True
    if isinstance(value, (int, float)):
        return value == 0
    return False


def is_past(value: Optional[datetime]) -> bool:
    """Date is before today"""
    if value is None:
        return False
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except:
            return False
    return value.date() < datetime.now().date()


def older_than_days(value: Optional[datetime], days: int) -> bool:
    """Date is more than N days ago"""
    if value is None:
        return False
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except:
            return False
    cutoff = datetime.now() - timedelta(days=days)
    return value < cutoff


def within_days(value: Optional[datetime], days: int) -> bool:
    """Date is within the next N days"""
    if value is None:
        return False
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except:
            return False

    now = datetime.now()
    future_cutoff = now + timedelta(days=days)
    return now <= value <= future_cutoff


def more_than_days_away(value: Optional[datetime], days: int) -> bool:
    """Date is more than N days in the future"""
    if value is None:
        return False
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except:
            return False

    future_cutoff = datetime.now() + timedelta(days=days)
    return value > future_cutoff


def greater_than(value: Any, threshold: float) -> bool:
    """Numeric value is greater than N"""
    if value is None:
        return False
    try:
        return float(value) > threshold
    except (ValueError, TypeError):
        return False


def less_than(value: Any, threshold: float) -> bool:
    """Numeric value is less than N"""
    if value is None:
        return False
    try:
        return float(value) < threshold
    except (ValueError, TypeError):
        return False


def equals(value: Any, target: Any) -> bool:
    """Value equals specified value"""
    if value is None and target is None:
        return True
    if value is None or target is None:
        return False

    # Case-insensitive string comparison
    if isinstance(value, str) and isinstance(target, str):
        return value.strip().lower() == target.strip().lower()

    return value == target


def in_list(value: Any, values: list) -> bool:
    """Value is in list of specified values"""
    if value is None:
        return False

    # Case-insensitive string comparison
    if isinstance(value, str):
        value_lower = value.strip().lower()
        return any(
            v.strip().lower() == value_lower
            for v in values
            if isinstance(v, str)
        )

    return value in values


# Operator registry
OPERATORS = {
    'is_empty': is_empty,
    'is_null_or_zero': is_null_or_zero,
    'is_past': is_past,
    'older_than_days': older_than_days,
    'within_days': within_days,
    'more_than_days_away': more_than_days_away,
    'greater_than': greater_than,
    'less_than': less_than,
    'equals': equals,
    'in': in_list,
}


def evaluate_operator(operator: str, value: Any, threshold: Any = None) -> bool:
    """
    Evaluate an operator against a value

    Args:
        operator: Name of the operator
        value: The value to test
        threshold: Optional threshold value for comparison

    Returns:
        True if the condition is met, False otherwise
    """
    if operator not in OPERATORS:
        raise ValueError(f"Unknown operator: {operator}")

    op_func = OPERATORS[operator]

    # Operators that don't need a threshold
    if operator in ['is_empty', 'is_null_or_zero', 'is_past']:
        return op_func(value)

    # Operators that need a threshold
    if threshold is None:
        raise ValueError(f"Operator '{operator}' requires a threshold value")

    return op_func(value, threshold)
