
import pytest
from unittest.mock import Mock
from app.utils.permissions import OrgPermissions, OrgRole
from fastapi import HTTPException

@pytest.fixture
def mock_db():
    return Mock()

@pytest.fixture
def permissions(mock_db):
    return OrgPermissions(mock_db)

@pytest.mark.asyncio
async def test_require_role_success(permissions, mock_db):
    mock_membership = Mock()
    mock_membership.role = OrgRole.ADMIN
    
    async def async_return_val(val):
        return val

    mock_db.orgmembership.find_first.side_effect = lambda **kwargs: async_return_val(mock_membership)
    
    # Analyze - Admin requesting Manager role (should pass)
    result = await permissions.require_role('user1', 'org1', OrgRole.MANAGER)
    assert result == mock_membership

@pytest.mark.asyncio
async def test_require_role_failure(permissions, mock_db):
    mock_membership = Mock()
    mock_membership.role = OrgRole.AE
    
    async def async_return_val(val):
        return val

    mock_db.orgmembership.find_first.side_effect = lambda **kwargs: async_return_val(mock_membership)
    
    # Analyze - AE requesting Manager role (should fail)
    with pytest.raises(HTTPException):
        await permissions.require_role('user1', 'org1', OrgRole.MANAGER)

@pytest.mark.asyncio
async def test_can_view_user_admin(permissions, mock_db):
    # Admin viewing any user
    mock_membership = Mock()
    mock_membership.role = OrgRole.ADMIN
    
    async def async_return_val(val):
        return val

    mock_db.orgmembership.find_first.side_effect = lambda **kwargs: async_return_val(mock_membership)
    
    assert await permissions.can_view_user('admin1', 'user2', 'org1') is True

@pytest.mark.asyncio
async def test_can_view_user_self(permissions):
    # User viewing themselves
    assert await permissions.can_view_user('user1', 'user1', 'org1') is True

@pytest.mark.asyncio
async def test_can_view_user_manager_report(permissions, mock_db):
    # Manager viewing direct report
    mock_manager_membership = Mock()
    mock_manager_membership.role = OrgRole.MANAGER
    
    async def async_side_effect(*args, **kwargs):
        # Check arguments to determine return value
        if 'reportsTo' in kwargs.get('where', {}):
             return Mock() # Found report
        return mock_manager_membership # Return manager membership

    mock_db.orgmembership.find_first.side_effect = async_side_effect
    
    assert await permissions.can_view_user('manager1', 'report1', 'org1') is True

@pytest.mark.asyncio
async def test_can_view_user_ae_other(permissions, mock_db):
    # AE viewing another user
    mock_membership = Mock()
    mock_membership.role = OrgRole.AE
    
    async def async_return_val(val):
        return val

    mock_db.orgmembership.find_first.side_effect = lambda **kwargs: async_return_val(mock_membership)
    
    # AE trying to view someone else
    assert await permissions.can_view_user('ae1', 'user2', 'org1') is False

@pytest.mark.asyncio
async def test_get_viewable_user_ids_admin(permissions, mock_db):
    mock_membership = Mock()
    mock_membership.role = OrgRole.ADMIN
    
    async def async_return_val(val):
        return val

    mock_db.orgmembership.find_first.side_effect = lambda **kwargs: async_return_val(mock_membership)
    
    member1 = Mock()
    member1.userId = 'u1'
    member2 = Mock()
    member2.userId = 'u2'
    
    mock_db.orgmembership.find_many.side_effect = lambda **kwargs: async_return_val([member1, member2])
    
    ids = await permissions.get_viewable_user_ids('admin1', 'org1')
    assert len(ids) == 2
    assert 'u1' in ids
    assert 'u2' in ids
