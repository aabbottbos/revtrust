
import pytest
from app.utils.export_generator import ExportGenerator
import csv
import io

def test_generate_csv():
    analysis_result = {
        'violations_by_deal': {
            'Deal 1': [{
                'category': 'Cat', 'severity': 'CRITICAL', 'rule_name': 'Rule',
                'message': 'Msg', 'remediation_action': 'Action',
                'remediation_owner': 'Owner', 'field_affected': 'Field',
                'current_value': 'Val'
            }]
        }
    }
    
    csv_content = ExportGenerator.generate_csv(analysis_result)
    
    # Verify by parsing it back
    reader = csv.DictReader(io.StringIO(csv_content))
    rows = list(reader)
    
    assert len(rows) == 1
    assert rows[0]['Deal Name'] == 'Deal 1'
    assert rows[0]['Issue Category'] == 'Cat'
    assert rows[0]['Severity'] == 'CRITICAL'

def test_generate_summary_text():
    analysis_result = {
        'filename': 'test.csv',
        'total_deals': 10,
        'deals_with_issues': 5,
        'health_score': 50,
        'critical_issues': 2,
        'warning_issues': 3,
        'violations_by_deal': {} # Simplified for this test
    }
    
    summary = ExportGenerator.generate_summary_text(analysis_result)
    
    assert "RevTrust Pipeline Analysis Summary" in summary
    assert "File: test.csv" in summary
    assert "Pipeline Health Score: 50/100" in summary
