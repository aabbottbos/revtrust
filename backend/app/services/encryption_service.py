"""
Token encryption service for secure storage of OAuth credentials
"""

from cryptography.fernet import Fernet
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

        encrypted = base64.urlsafe_b64decode(ciphertext.encode())
        decrypted = self.cipher.decrypt(encrypted)
        return decrypted.decode()


def get_encryption_service() -> EncryptionService:
    """Get encryption service instance"""
    return EncryptionService()
