
import pytest
from app.utils.user_manager import UserManager, get_user_manager

def test_get_or_create_user_new():
    manager = UserManager()
    
    user = manager.get_or_create_user("clerk123", "test@example.com")
    
    assert user['clerk_user_id'] == "clerk123"
    assert user['email'] == "test@example.com"
    assert "clerk123" in manager.users

def test_get_or_create_user_existing():
    manager = UserManager()
    # Create first
    manager.get_or_create_user("clerk123", "test@example.com")
    
    # Get second
    user = manager.get_or_create_user("clerk123", "new@example.com")
    
    # Should return original email
    assert user['email'] == "test@example.com" 

def test_get_user_by_clerk_id():
    manager = UserManager()
    manager.get_or_create_user("clerk123", "test@example.com")
    
    user = manager.get_user_by_clerk_id("clerk123")
    assert user is not None
    assert user['email'] == "test@example.com"
    
    assert manager.get_user_by_clerk_id("notfound") is None

def test_singleton():
    manager1 = get_user_manager()
    manager2 = get_user_manager()
    assert manager1 is manager2
