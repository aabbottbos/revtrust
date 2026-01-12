
import pytest
from unittest.mock import Mock, patch, mock_open
from app.utils.rules_loader import RulesLoader, ContextualRulesLoader, BusinessRule
import tempfile
import yaml
import os

@pytest.fixture
def mock_rules_yaml():
    rules_data = {
        'data_quality_rules': [
            {
                'id': 'DQ1',
                'name': 'DQ Rule',
                'category': 'DATA_QUALITY',
                'severity': 'CRITICAL',
                'description': 'Desc',
                'condition': {'field': 'f', 'operator': 'o', 'value': 100},
                'message': 'Msg',
                'remediation': 'Fix',
                'remediation_owner': 'Rep',
                'automatable': True,
                'applicable_stages': ['Discovery']
            }
        ]
    }
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.yaml') as tmp:
        yaml.dump(rules_data, tmp)
        tmp_path = tmp.name
        
    yield tmp_path
    os.remove(tmp_path)

def test_load_global_rules(mock_rules_yaml):
    loader = RulesLoader(config_path=mock_rules_yaml)
    rules = loader.get_all_rules()
    
    assert len(rules) == 1
    rule = rules[0]
    assert rule.id == 'DQ1'
    assert rule.category == 'DATA_QUALITY'
    assert rule.scope == 'global'

def test_get_rules_for_stage(mock_rules_yaml):
    loader = RulesLoader(config_path=mock_rules_yaml)
    
    # Matching stage
    rules = loader.get_rules_for_stage('Discovery')
    assert len(rules) == 1
    
    # Non-matching stage
    rules = loader.get_rules_for_stage('Closed Won')
    assert len(rules) == 0

@pytest.mark.asyncio
async def test_contextual_loader_overrides(mock_rules_yaml):
    loader = ContextualRulesLoader(config_path=mock_rules_yaml)
    
    # Mock DB response for overrides
    mock_db = Mock()
    mock_override = Mock()
    mock_override.globalRuleId = 'DQ1'
    mock_override.enabled = True
    mock_override.thresholdOverrides = {'value': 999}
    
    # helper for async return
    async def async_return(val):
        return val

    mock_db.globalruleoverride.find_many.side_effect = lambda **kwargs: async_return([mock_override])
    mock_db.customrule.find_many.side_effect = lambda **kwargs: async_return([])
    
    # Load context
    await loader.load_context(mock_db, user_id='user1', org_id='org1')
    
    effective_rules = loader.get_effective_rules()
    assert len(effective_rules) == 1
    rule = effective_rules[0]
    
    assert rule.id == 'DQ1'
    # Verify override applied
    assert rule.condition['value'] == 999 

@pytest.mark.asyncio
async def test_contextual_loader_custom_rules(mock_rules_yaml):
    loader = ContextualRulesLoader(config_path=mock_rules_yaml)
    
    # helper for async return
    async def async_return(val):
        return val

    mock_db = Mock()
    mock_db.globalruleoverride.find_many.side_effect = lambda **kwargs: async_return([])
    
    # Mock custom rule
    mock_custom_rule = Mock()
    mock_custom_rule.ruleId = 'CUST1'
    mock_custom_rule.name = 'Custom Rule'
    mock_custom_rule.category = 'DATA_QUALITY'
    mock_custom_rule.severity = 'INFO'
    mock_custom_rule.description = 'Desc'
    mock_custom_rule.condition = {}
    mock_custom_rule.message = 'Msg'
    mock_custom_rule.remediation = 'Rem'
    mock_custom_rule.remediationOwner = 'Rep'
    mock_custom_rule.automatable = False
    mock_custom_rule.applicableStages = []
    mock_custom_rule.priority = 10
    mock_custom_rule.enabled = True
    mock_custom_rule.userId = 'user1'
    mock_custom_rule.orgId = None
    
    mock_db.customrule.find_many.side_effect = lambda **kwargs: async_return([mock_custom_rule])
    
    await loader.load_context(mock_db, user_id='user1')
    
    effective_rules = loader.get_effective_rules()
    # 1 global + 1 custom
    assert len(effective_rules) == 2
    
    ids = [r.id for r in effective_rules]
    assert 'DQ1' in ids
    assert 'CUST1' in ids
