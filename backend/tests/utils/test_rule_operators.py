
import pytest
from datetime import datetime, timedelta
from app.utils.rule_operators import evaluate_operator

def test_is_empty():
    assert evaluate_operator('is_empty', None) is True
    assert evaluate_operator('is_empty', '') is True
    assert evaluate_operator('is_empty', '   ') is True
    assert evaluate_operator('is_empty', 'value') is False
    assert evaluate_operator('is_empty', 0) is False

def test_is_null_or_zero():
    assert evaluate_operator('is_null_or_zero', None) is True
    assert evaluate_operator('is_null_or_zero', 0) is True
    assert evaluate_operator('is_null_or_zero', 0.0) is True
    assert evaluate_operator('is_null_or_zero', 1) is False
    assert evaluate_operator('is_null_or_zero', 'string') is False

def test_comparison_operators():
    assert evaluate_operator('greater_than', 10, 5) is True
    assert evaluate_operator('greater_than', 5, 10) is False
    assert evaluate_operator('less_than', 5, 10) is True
    assert evaluate_operator('equals', 'test', 'test') is True
    assert evaluate_operator('equals', 'Test', 'test') is True # Case insensitive

def test_date_operators():
    # Helper to format date
    def days_ago(n):
        return (datetime.now() - timedelta(days=n)).isoformat()
        
    def days_future(n):
        return (datetime.now() + timedelta(days=n)).isoformat()

    # is_past
    assert evaluate_operator('is_past', days_ago(1)) is True
    assert evaluate_operator('is_past', days_future(1)) is False
    
    # older_than_days
    assert evaluate_operator('older_than_days', days_ago(10), 5) is True  # 10 days ago is older than 5 days
    assert evaluate_operator('older_than_days', days_ago(2), 5) is False
    
    # within_days
    assert evaluate_operator('within_days', days_future(2), 5) is True
    assert evaluate_operator('within_days', days_future(10), 5) is False
    
    # more_than_days_away
    assert evaluate_operator('more_than_days_away', days_future(10), 5) is True
    assert evaluate_operator('more_than_days_away', days_future(2), 5) is False

def test_in_list():
    assert evaluate_operator('in', 'apple', ['apple', 'banana']) is True
    assert evaluate_operator('in', 'Apple', ['apple', 'banana']) is True # Case insensitive
    assert evaluate_operator('in', 'cherry', ['apple', 'banana']) is False

def test_invalid_operator():
    with pytest.raises(ValueError):
        evaluate_operator('invalid_op', 'value')

def test_missing_threshold():
    with pytest.raises(ValueError, match="requires a threshold"):
        evaluate_operator('greater_than', 10)
