"""
Encryption service for secure storage of sensitive data (OAuth credentials, API keys)
"""

from cryptography.fernet import Fernet, InvalidToken
import os
import base64


class EncryptionService:
    """Handle encryption/decryption of sensitive data"""

    def __init__(self):
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            raise ValueError("ENCRYPTION_KEY not set in environment")

        # Ensure key is bytes
        if isinstance(key, str):
            key = key.encode()

        self.cipher = Fernet(key)

    def encrypt(self, plaintext: str) -> str:
        """Encrypt a string and return base64-encoded ciphertext"""
        if not plaintext:
            return ""

        encrypted = self.cipher.encrypt(plaintext.encode())
        return base64.urlsafe_b64encode(encrypted).decode()

    def decrypt(self, ciphertext: str) -> str:
        """Decrypt base64-encoded ciphertext"""
        if not ciphertext:
            return ""

        try:
            encrypted = base64.urlsafe_b64decode(ciphertext.encode())
            decrypted = self.cipher.decrypt(encrypted)
            return decrypted.decode()
        except InvalidToken:
            raise ValueError("Decryption failed - invalid key or corrupted data")

    def mask_api_key(self, api_key: str, visible_chars: int = 4) -> str:
        """
        Mask an API key for display purposes.
        Shows only the last N characters.

        Args:
            api_key: The full API key
            visible_chars: Number of characters to show at the end

        Returns:
            Masked string like "sk-...abc123"
        """
        if not api_key:
            return ""

        if len(api_key) <= visible_chars:
            return "*" * len(api_key)

        # Show prefix if it looks like a standard API key format
        prefix = ""
        if api_key.startswith("sk-ant-"):
            prefix = "sk-ant-"
        elif api_key.startswith("sk-"):
            prefix = "sk-"

        return f"{prefix}...{api_key[-visible_chars:]}"


# Singleton instance
_encryption_service: EncryptionService | None = None


def get_encryption_service() -> EncryptionService:
    """Get singleton encryption service instance"""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service


def generate_encryption_key() -> str:
    """
    Generate a new Fernet encryption key.
    Useful for initial setup.

    Returns:
        A valid Fernet key as a string
    """
    return Fernet.generate_key().decode()
