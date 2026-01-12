
import pytest
from unittest.mock import Mock, patch, mock_open
from app.utils.field_mapper import FieldMapper
import json

@pytest.fixture
def field_config():
    return {
        'mappings': {
            'amount': {
                'required': True,
                'aliases': ['deal value', 'revenue']
            },
            'stage': {
                'required': True,
                'aliases': ['deal stage', 'status']
            }
        }
    }

@pytest.fixture
def mapper(field_config):
    with patch('builtins.open', mock_open(read_data="")) as mock_file:
        with patch('yaml.safe_load', return_value=field_config):
            # Also patch env to avoid trying to create real Anthropic client
            with patch('os.getenv', return_value=None):
                yield FieldMapper()

def test_rule_based_fallback(mapper):
    csv_headers = ['Deal Value', 'Status', 'Random Column']
    
    result = mapper.map_fields_with_ai(csv_headers)
    mappings = result['mappings']
    
    # Check amount mapping (alias match)
    assert 'Deal Value' in mappings
    assert mappings['Deal Value']['standard_field'] == 'amount'
    assert mappings['Deal Value']['confidence'] > 0.8
    
    # Check stage mapping (alias match)
    assert 'Status' in mappings
    assert mappings['Status']['standard_field'] == 'stage'
    
    # Check random column (no match)
    assert 'Random Column' in mappings
    assert mappings['Random Column']['standard_field'] is None

def test_missing_required_fields(mapper):
    csv_headers = ['Random Column']
    
    result = mapper.map_fields_with_ai(csv_headers)
    
    assert 'amount' in result['unmapped_required_fields']
    assert 'stage' in result['unmapped_required_fields']

def test_apply_mapping(mapper):
    data = [
        {'Deal Value': '100', 'Status': 'Won', 'Random': 'X'}
    ]
    
    mapping_result = {
        'mappings': {
            'Deal Value': {'standard_field': 'amount'},
            'Status': {'standard_field': 'stage'}
        }
    }
    
    mapped_data = mapper.apply_mapping(data, mapping_result)
    
    assert len(mapped_data) == 1
    row = mapped_data[0]
    
    assert row['amount'] == '100'
    assert row['stage'] == 'Won'
    assert 'Random' not in row # Unmapped columns should be dropped
    assert 'id' in row # ID should be generated

def test_ai_mapping_flow(field_config):
    # Setup mock Anthropic client
    mock_client = Mock()
    mock_response = Mock()
    
    # Mock Claude response
    ai_response = {
        "mappings": {
            "Total": {"standard_field": "amount", "confidence": 0.9, "reasoning": "Matches"}
        },
        "unmapped_required_fields": [],
        "warnings": []
    }
    mock_response.content = [Mock(text=json.dumps(ai_response))]
    mock_client.messages.create.return_value = mock_response
    
    with patch('builtins.open', mock_open(read_data="")), \
         patch('yaml.safe_load', return_value=field_config), \
         patch('os.getenv', return_value="fake_key"), \
         patch('app.utils.field_mapper.Anthropic', return_value=mock_client):
        
        mapper = FieldMapper()
        result = mapper.map_fields_with_ai(['Total'])
        
        assert result['mappings']['Total']['standard_field'] == 'amount'
        mock_client.messages.create.assert_called_once()
