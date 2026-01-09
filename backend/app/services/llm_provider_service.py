"""
LLM Provider Service
Manages LLM provider configurations (API keys, models, etc.)
"""

import os
from datetime import datetime
from typing import Optional, List, Dict, Any
from prisma import Prisma, Json
from pydantic import BaseModel
import anthropic
import httpx

from app.services.encryption_service import get_encryption_service


# Known models for each provider
PROVIDER_MODELS = {
    "anthropic": [
        "claude-sonnet-4-20250514",
        "claude-opus-4-20250514",
        "claude-sonnet-4-5-20250929",
        "claude-3-5-sonnet-20241022",
        "claude-3-haiku-20240307",
    ],
    "openai": [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
        "gpt-4",
        "gpt-3.5-turbo",
        "o1",
        "o1-mini",
    ],
    "gemini": [
        "gemini-2.0-flash-exp",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-1.0-pro",
    ],
}


class ProviderCreate(BaseModel):
    """Schema for creating a new provider"""
    name: str  # "anthropic", "openai", "gemini"
    displayName: str
    apiKey: str
    defaultModel: Optional[str] = None


class ProviderUpdate(BaseModel):
    """Schema for updating a provider"""
    displayName: Optional[str] = None
    apiKey: Optional[str] = None  # Only update if provided
    defaultModel: Optional[str] = None
    isActive: Optional[bool] = None


class ProviderResponse(BaseModel):
    """Schema for provider response (without sensitive data)"""
    id: str
    name: str
    displayName: str
    apiKeyMasked: str
    isActive: bool
    availableModels: List[str]
    defaultModel: Optional[str]
    lastTestedAt: Optional[datetime]
    testStatus: Optional[str]
    createdAt: datetime
    updatedAt: datetime


class LLMProviderService:
    """Manage LLM provider configurations"""

    def __init__(self):
        self.prisma = Prisma()
        self.encryption = get_encryption_service()

    async def connect(self):
        if not self.prisma.is_connected():
            await self.prisma.connect()

    async def disconnect(self):
        if self.prisma.is_connected():
            await self.prisma.disconnect()

    async def list_providers(self) -> List[ProviderResponse]:
        """List all configured providers"""
        try:
            await self.connect()

            providers = await self.prisma.llmprovider.find_many(
                order={"createdAt": "asc"}
            )

            result = []
            for p in providers:
                # Decrypt and mask API key for display
                try:
                    decrypted_key = self.encryption.decrypt(p.apiKeyEncrypted)
                    masked_key = self.encryption.mask_api_key(decrypted_key)
                except Exception:
                    masked_key = "***decryption error***"

                result.append(ProviderResponse(
                    id=p.id,
                    name=p.name,
                    displayName=p.displayName,
                    apiKeyMasked=masked_key,
                    isActive=p.isActive,
                    availableModels=p.availableModels if p.availableModels else [],
                    defaultModel=p.defaultModel,
                    lastTestedAt=p.lastTestedAt,
                    testStatus=p.testStatus,
                    createdAt=p.createdAt,
                    updatedAt=p.updatedAt,
                ))

            return result

        finally:
            await self.disconnect()

    async def get_provider(self, provider_id: str) -> Optional[ProviderResponse]:
        """Get a single provider by ID"""
        try:
            await self.connect()

            p = await self.prisma.llmprovider.find_unique(
                where={"id": provider_id}
            )

            if not p:
                return None

            try:
                decrypted_key = self.encryption.decrypt(p.apiKeyEncrypted)
                masked_key = self.encryption.mask_api_key(decrypted_key)
            except Exception:
                masked_key = "***decryption error***"

            return ProviderResponse(
                id=p.id,
                name=p.name,
                displayName=p.displayName,
                apiKeyMasked=masked_key,
                isActive=p.isActive,
                availableModels=p.availableModels if p.availableModels else [],
                defaultModel=p.defaultModel,
                lastTestedAt=p.lastTestedAt,
                testStatus=p.testStatus,
                createdAt=p.createdAt,
                updatedAt=p.updatedAt,
            )

        finally:
            await self.disconnect()

    async def get_provider_by_name(self, name: str) -> Optional[ProviderResponse]:
        """Get a provider by name (anthropic, openai, gemini)"""
        try:
            await self.connect()

            p = await self.prisma.llmprovider.find_unique(
                where={"name": name}
            )

            if not p:
                return None

            try:
                decrypted_key = self.encryption.decrypt(p.apiKeyEncrypted)
                masked_key = self.encryption.mask_api_key(decrypted_key)
            except Exception:
                masked_key = "***decryption error***"

            return ProviderResponse(
                id=p.id,
                name=p.name,
                displayName=p.displayName,
                apiKeyMasked=masked_key,
                isActive=p.isActive,
                availableModels=p.availableModels if p.availableModels else [],
                defaultModel=p.defaultModel,
                lastTestedAt=p.lastTestedAt,
                testStatus=p.testStatus,
                createdAt=p.createdAt,
                updatedAt=p.updatedAt,
            )

        finally:
            await self.disconnect()

    async def get_decrypted_api_key(self, provider_id: str) -> Optional[str]:
        """Get the decrypted API key for a provider (internal use only)"""
        try:
            await self.connect()

            p = await self.prisma.llmprovider.find_unique(
                where={"id": provider_id}
            )

            if not p:
                return None

            return self.encryption.decrypt(p.apiKeyEncrypted)

        finally:
            await self.disconnect()

    async def get_decrypted_api_key_by_name(self, name: str) -> Optional[str]:
        """Get the decrypted API key by provider name (internal use only)"""
        try:
            await self.connect()

            p = await self.prisma.llmprovider.find_unique(
                where={"name": name}
            )

            if not p or not p.isActive:
                return None

            return self.encryption.decrypt(p.apiKeyEncrypted)

        finally:
            await self.disconnect()

    async def create_provider(
        self,
        data: ProviderCreate,
        user_id: str
    ) -> ProviderResponse:
        """Create a new provider configuration"""
        try:
            await self.connect()

            # Encrypt the API key
            encrypted_key = self.encryption.encrypt(data.apiKey)

            # Get available models for this provider
            available_models = PROVIDER_MODELS.get(data.name.lower(), [])

            # Set default model if not specified
            default_model = data.defaultModel
            if not default_model and available_models:
                default_model = available_models[0]

            p = await self.prisma.llmprovider.create(
                data={
                    "name": data.name.lower(),
                    "displayName": data.displayName,
                    "apiKeyEncrypted": encrypted_key,
                    "availableModels": Json(available_models),
                    "defaultModel": default_model,
                    "createdBy": user_id,
                    "testStatus": "untested",
                }
            )

            masked_key = self.encryption.mask_api_key(data.apiKey)

            return ProviderResponse(
                id=p.id,
                name=p.name,
                displayName=p.displayName,
                apiKeyMasked=masked_key,
                isActive=p.isActive,
                availableModels=p.availableModels if p.availableModels else [],
                defaultModel=p.defaultModel,
                lastTestedAt=p.lastTestedAt,
                testStatus=p.testStatus,
                createdAt=p.createdAt,
                updatedAt=p.updatedAt,
            )

        finally:
            await self.disconnect()

    async def update_provider(
        self,
        provider_id: str,
        data: ProviderUpdate
    ) -> Optional[ProviderResponse]:
        """Update an existing provider"""
        try:
            await self.connect()

            update_data: Dict[str, Any] = {}

            if data.displayName is not None:
                update_data["displayName"] = data.displayName

            if data.apiKey is not None:
                update_data["apiKeyEncrypted"] = self.encryption.encrypt(data.apiKey)
                update_data["testStatus"] = "untested"

            if data.defaultModel is not None:
                update_data["defaultModel"] = data.defaultModel

            if data.isActive is not None:
                update_data["isActive"] = data.isActive

            if not update_data:
                return await self.get_provider(provider_id)

            p = await self.prisma.llmprovider.update(
                where={"id": provider_id},
                data=update_data
            )

            try:
                decrypted_key = self.encryption.decrypt(p.apiKeyEncrypted)
                masked_key = self.encryption.mask_api_key(decrypted_key)
            except Exception:
                masked_key = "***decryption error***"

            return ProviderResponse(
                id=p.id,
                name=p.name,
                displayName=p.displayName,
                apiKeyMasked=masked_key,
                isActive=p.isActive,
                availableModels=p.availableModels if p.availableModels else [],
                defaultModel=p.defaultModel,
                lastTestedAt=p.lastTestedAt,
                testStatus=p.testStatus,
                createdAt=p.createdAt,
                updatedAt=p.updatedAt,
            )

        finally:
            await self.disconnect()

    async def delete_provider(self, provider_id: str) -> bool:
        """Delete a provider"""
        try:
            await self.connect()

            await self.prisma.llmprovider.delete(
                where={"id": provider_id}
            )
            return True

        except Exception:
            return False

        finally:
            await self.disconnect()

    async def test_provider(self, provider_id: str) -> Dict[str, Any]:
        """
        Test a provider's API connection by making a simple API call.
        Returns test result with status and any error message.
        """
        try:
            await self.connect()

            p = await self.prisma.llmprovider.find_unique(
                where={"id": provider_id}
            )

            if not p:
                return {"success": False, "error": "Provider not found"}

            api_key = self.encryption.decrypt(p.apiKeyEncrypted)
            model = p.defaultModel or (p.availableModels[0] if p.availableModels else None)

            test_result = await self._test_provider_connection(p.name, api_key, model)

            # Update provider with test result
            await self.prisma.llmprovider.update(
                where={"id": provider_id},
                data={
                    "lastTestedAt": datetime.utcnow(),
                    "testStatus": "success" if test_result["success"] else "failed",
                }
            )

            return test_result

        finally:
            await self.disconnect()

    async def _test_provider_connection(
        self,
        provider_name: str,
        api_key: str,
        model: Optional[str]
    ) -> Dict[str, Any]:
        """Test connection to a specific provider"""

        if provider_name == "anthropic":
            return await self._test_anthropic(api_key, model)
        elif provider_name == "openai":
            return await self._test_openai(api_key, model)
        elif provider_name == "gemini":
            return await self._test_gemini(api_key, model)
        else:
            return {"success": False, "error": f"Unknown provider: {provider_name}"}

    async def _test_anthropic(self, api_key: str, model: Optional[str]) -> Dict[str, Any]:
        """Test Anthropic API connection"""
        try:
            client = anthropic.Anthropic(api_key=api_key)
            test_model = model or "claude-sonnet-4-20250514"

            response = client.messages.create(
                model=test_model,
                max_tokens=10,
                messages=[{"role": "user", "content": "Say 'test' and nothing else."}]
            )

            return {
                "success": True,
                "message": f"Successfully connected to Anthropic. Model: {test_model}",
                "response": response.content[0].text if response.content else None,
            }
        except anthropic.AuthenticationError:
            return {"success": False, "error": "Invalid API key"}
        except anthropic.RateLimitError:
            return {"success": False, "error": "Rate limit exceeded"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _test_openai(self, api_key: str, model: Optional[str]) -> Dict[str, Any]:
        """Test OpenAI API connection"""
        try:
            test_model = model or "gpt-4o-mini"

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": test_model,
                        "messages": [{"role": "user", "content": "Say 'test' and nothing else."}],
                        "max_tokens": 10,
                    },
                    timeout=30.0,
                )

                if response.status_code == 401:
                    return {"success": False, "error": "Invalid API key"}
                elif response.status_code == 429:
                    return {"success": False, "error": "Rate limit exceeded"}
                elif response.status_code != 200:
                    return {"success": False, "error": f"API error: {response.status_code}"}

                data = response.json()
                return {
                    "success": True,
                    "message": f"Successfully connected to OpenAI. Model: {test_model}",
                    "response": data.get("choices", [{}])[0].get("message", {}).get("content"),
                }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _test_gemini(self, api_key: str, model: Optional[str]) -> Dict[str, Any]:
        """Test Google Gemini API connection"""
        try:
            test_model = model or "gemini-1.5-flash"

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{test_model}:generateContent",
                    headers={"Content-Type": "application/json"},
                    params={"key": api_key},
                    json={
                        "contents": [{"parts": [{"text": "Say 'test' and nothing else."}]}],
                        "generationConfig": {"maxOutputTokens": 10},
                    },
                    timeout=30.0,
                )

                if response.status_code == 401 or response.status_code == 403:
                    return {"success": False, "error": "Invalid API key"}
                elif response.status_code == 429:
                    return {"success": False, "error": "Rate limit exceeded"}
                elif response.status_code != 200:
                    return {"success": False, "error": f"API error: {response.status_code}"}

                data = response.json()
                text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text")
                return {
                    "success": True,
                    "message": f"Successfully connected to Gemini. Model: {test_model}",
                    "response": text,
                }
        except Exception as e:
            return {"success": False, "error": str(e)}


def get_llm_provider_service() -> LLMProviderService:
    """Get LLM provider service instance"""
    return LLMProviderService()
