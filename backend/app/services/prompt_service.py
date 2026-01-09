"""
Prompt Service
Manages prompts, versions, and prompt testing
"""

import json
import time
from datetime import datetime
from typing import Optional, List, Dict, Any
from prisma import Prisma
from prisma.enums import PromptCategory, ExperimentStatus
from pydantic import BaseModel
import anthropic
import httpx

from app.services.encryption_service import get_encryption_service


class VersionCreate(BaseModel):
    """Schema for creating a new prompt version"""
    content: str
    changeNote: Optional[str] = None
    providerId: Optional[str] = None  # Override provider
    model: Optional[str] = None  # Override model


class PromptUpdate(BaseModel):
    """Schema for updating prompt settings"""
    name: Optional[str] = None
    description: Optional[str] = None
    providerId: Optional[str] = None
    model: Optional[str] = None
    maxTokens: Optional[int] = None
    temperature: Optional[float] = None
    activeVersionId: Optional[str] = None


class PromptTestRequest(BaseModel):
    """Schema for testing a prompt"""
    versionId: Optional[str] = None  # If not provided, uses active version
    sampleData: Dict[str, Any]  # Sample data to pass to the prompt


class PromptVersionResponse(BaseModel):
    """Schema for prompt version response"""
    id: str
    promptId: str
    version: int
    content: str
    providerId: Optional[str]
    model: Optional[str]
    changeNote: Optional[str]
    createdAt: datetime
    createdBy: str


class PromptResponse(BaseModel):
    """Schema for prompt response"""
    id: str
    slug: str
    name: str
    description: str
    category: str
    providerId: str
    model: str
    activeVersionId: Optional[str]
    maxTokens: int
    temperature: float
    isSystemPrompt: bool
    createdAt: datetime
    updatedAt: datetime
    versions: Optional[List[PromptVersionResponse]] = None
    activeVersion: Optional[PromptVersionResponse] = None


class PromptService:
    """Manage prompts and versions"""

    def __init__(self):
        self.prisma = Prisma()
        self.encryption = get_encryption_service()

    async def connect(self):
        if not self.prisma.is_connected():
            await self.prisma.connect()

    async def disconnect(self):
        if self.prisma.is_connected():
            await self.prisma.disconnect()

    async def list_prompts(
        self,
        category: Optional[str] = None,
        include_versions: bool = False
    ) -> List[PromptResponse]:
        """List all prompts, optionally filtered by category"""
        try:
            await self.connect()

            where = {}
            if category:
                where["category"] = PromptCategory(category.upper())

            prompts = await self.prisma.prompt.find_many(
                where=where,
                order={"slug": "asc"},
                include={
                    "versions": include_versions,
                }
            )

            result = []
            for p in prompts:
                versions = None
                active_version = None

                if include_versions and p.versions:
                    versions = [
                        PromptVersionResponse(
                            id=v.id,
                            promptId=v.promptId,
                            version=v.version,
                            content=v.content,
                            providerId=v.providerId,
                            model=v.model,
                            changeNote=v.changeNote,
                            createdAt=v.createdAt,
                            createdBy=v.createdBy,
                        )
                        for v in sorted(p.versions, key=lambda x: x.version, reverse=True)
                    ]

                    # Find active version
                    if p.activeVersionId:
                        for v in versions:
                            if v.id == p.activeVersionId:
                                active_version = v
                                break

                result.append(PromptResponse(
                    id=p.id,
                    slug=p.slug,
                    name=p.name,
                    description=p.description,
                    category=p.category.value if hasattr(p.category, 'value') else str(p.category),
                    providerId=p.providerId,
                    model=p.model,
                    activeVersionId=p.activeVersionId,
                    maxTokens=p.maxTokens,
                    temperature=p.temperature,
                    isSystemPrompt=p.isSystemPrompt,
                    createdAt=p.createdAt,
                    updatedAt=p.updatedAt,
                    versions=versions,
                    activeVersion=active_version,
                ))

            return result

        finally:
            await self.disconnect()

    async def get_prompt(
        self,
        slug: str,
        include_versions: bool = True
    ) -> Optional[PromptResponse]:
        """Get a single prompt by slug"""
        try:
            await self.connect()

            p = await self.prisma.prompt.find_unique(
                where={"slug": slug},
                include={
                    "versions": include_versions,
                }
            )

            if not p:
                return None

            versions = None
            active_version = None

            if include_versions and p.versions:
                versions = [
                    PromptVersionResponse(
                        id=v.id,
                        promptId=v.promptId,
                        version=v.version,
                        content=v.content,
                        providerId=v.providerId,
                        model=v.model,
                        changeNote=v.changeNote,
                        createdAt=v.createdAt,
                        createdBy=v.createdBy,
                    )
                    for v in sorted(p.versions, key=lambda x: x.version, reverse=True)
                ]

                if p.activeVersionId:
                    for v in versions:
                        if v.id == p.activeVersionId:
                            active_version = v
                            break

            return PromptResponse(
                id=p.id,
                slug=p.slug,
                name=p.name,
                description=p.description,
                category=p.category.value if hasattr(p.category, 'value') else str(p.category),
                providerId=p.providerId,
                model=p.model,
                activeVersionId=p.activeVersionId,
                maxTokens=p.maxTokens,
                temperature=p.temperature,
                isSystemPrompt=p.isSystemPrompt,
                createdAt=p.createdAt,
                updatedAt=p.updatedAt,
                versions=versions,
                activeVersion=active_version,
            )

        finally:
            await self.disconnect()

    async def get_prompt_by_id(self, prompt_id: str) -> Optional[PromptResponse]:
        """Get a single prompt by ID"""
        try:
            await self.connect()

            p = await self.prisma.prompt.find_unique(
                where={"id": prompt_id},
                include={"versions": True}
            )

            if not p:
                return None

            versions = None
            active_version = None

            if p.versions:
                versions = [
                    PromptVersionResponse(
                        id=v.id,
                        promptId=v.promptId,
                        version=v.version,
                        content=v.content,
                        providerId=v.providerId,
                        model=v.model,
                        changeNote=v.changeNote,
                        createdAt=v.createdAt,
                        createdBy=v.createdBy,
                    )
                    for v in sorted(p.versions, key=lambda x: x.version, reverse=True)
                ]

                if p.activeVersionId:
                    for v in versions:
                        if v.id == p.activeVersionId:
                            active_version = v
                            break

            return PromptResponse(
                id=p.id,
                slug=p.slug,
                name=p.name,
                description=p.description,
                category=p.category.value if hasattr(p.category, 'value') else str(p.category),
                providerId=p.providerId,
                model=p.model,
                activeVersionId=p.activeVersionId,
                maxTokens=p.maxTokens,
                temperature=p.temperature,
                isSystemPrompt=p.isSystemPrompt,
                createdAt=p.createdAt,
                updatedAt=p.updatedAt,
                versions=versions,
                activeVersion=active_version,
            )

        finally:
            await self.disconnect()

    async def update_prompt(
        self,
        slug: str,
        data: PromptUpdate
    ) -> Optional[PromptResponse]:
        """Update prompt settings"""
        try:
            await self.connect()

            update_data: Dict[str, Any] = {}

            if data.name is not None:
                update_data["name"] = data.name
            if data.description is not None:
                update_data["description"] = data.description
            if data.providerId is not None:
                update_data["providerId"] = data.providerId
            if data.model is not None:
                update_data["model"] = data.model
            if data.maxTokens is not None:
                update_data["maxTokens"] = data.maxTokens
            if data.temperature is not None:
                update_data["temperature"] = data.temperature
            if data.activeVersionId is not None:
                update_data["activeVersionId"] = data.activeVersionId

            if not update_data:
                return await self.get_prompt(slug)

            await self.prisma.prompt.update(
                where={"slug": slug},
                data=update_data
            )

            return await self.get_prompt(slug)

        finally:
            await self.disconnect()

    async def create_version(
        self,
        slug: str,
        data: VersionCreate,
        user_id: str,
        set_as_active: bool = True
    ) -> PromptVersionResponse:
        """Create a new version of a prompt"""
        try:
            await self.connect()

            # Get the prompt
            prompt = await self.prisma.prompt.find_unique(
                where={"slug": slug},
                include={"versions": True}
            )

            if not prompt:
                raise ValueError(f"Prompt not found: {slug}")

            # Calculate next version number
            max_version = max([v.version for v in prompt.versions], default=0) if prompt.versions else 0
            next_version = max_version + 1

            # Create the version
            version = await self.prisma.promptversion.create(
                data={
                    "promptId": prompt.id,
                    "version": next_version,
                    "content": data.content,
                    "providerId": data.providerId,
                    "model": data.model,
                    "changeNote": data.changeNote,
                    "createdBy": user_id,
                }
            )

            # Set as active version if requested
            if set_as_active:
                await self.prisma.prompt.update(
                    where={"id": prompt.id},
                    data={"activeVersionId": version.id}
                )

            return PromptVersionResponse(
                id=version.id,
                promptId=version.promptId,
                version=version.version,
                content=version.content,
                providerId=version.providerId,
                model=version.model,
                changeNote=version.changeNote,
                createdAt=version.createdAt,
                createdBy=version.createdBy,
            )

        finally:
            await self.disconnect()

    async def get_version(self, version_id: str) -> Optional[PromptVersionResponse]:
        """Get a specific version by ID"""
        try:
            await self.connect()

            v = await self.prisma.promptversion.find_unique(
                where={"id": version_id}
            )

            if not v:
                return None

            return PromptVersionResponse(
                id=v.id,
                promptId=v.promptId,
                version=v.version,
                content=v.content,
                providerId=v.providerId,
                model=v.model,
                changeNote=v.changeNote,
                createdAt=v.createdAt,
                createdBy=v.createdBy,
            )

        finally:
            await self.disconnect()

    async def test_prompt(
        self,
        slug: str,
        request: PromptTestRequest,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Test a prompt with sample data.
        Returns the LLM response along with metrics.
        """
        try:
            await self.connect()

            # Get the prompt with provider info
            prompt = await self.prisma.prompt.find_unique(
                where={"slug": slug},
                include={
                    "provider": True,
                    "versions": True,
                }
            )

            if not prompt:
                return {"success": False, "error": f"Prompt not found: {slug}"}

            # Determine which version to use
            version_id = request.versionId or prompt.activeVersionId

            if not version_id:
                return {"success": False, "error": "No version specified and no active version set"}

            version = None
            for v in prompt.versions:
                if v.id == version_id:
                    version = v
                    break

            if not version:
                return {"success": False, "error": f"Version not found: {version_id}"}

            # Get provider and model
            provider_id = version.providerId or prompt.providerId
            model = version.model or prompt.model

            provider = await self.prisma.llmprovider.find_unique(
                where={"id": provider_id}
            )

            if not provider:
                return {"success": False, "error": "Provider not configured"}

            if not provider.isActive:
                return {"success": False, "error": "Provider is not active"}

            # Decrypt API key
            api_key = self.encryption.decrypt(provider.apiKeyEncrypted)

            # Build the prompt with sample data
            rendered_prompt = self._render_prompt(version.content, request.sampleData)

            # Execute the prompt
            start_time = time.time()
            result = await self._execute_prompt(
                provider_name=provider.name,
                api_key=api_key,
                model=model,
                prompt=rendered_prompt,
                max_tokens=prompt.maxTokens,
                temperature=prompt.temperature,
            )
            latency_ms = int((time.time() - start_time) * 1000)

            # Log usage
            await self.prisma.promptusagelog.create(
                data={
                    "promptId": prompt.id,
                    "versionId": version.id,
                    "latencyMs": latency_ms,
                    "inputTokens": result.get("input_tokens", 0),
                    "outputTokens": result.get("output_tokens", 0),
                    "totalTokens": result.get("total_tokens", 0),
                    "success": result.get("success", False),
                    "errorMessage": result.get("error"),
                    "userId": user_id,
                }
            )

            return {
                "success": result.get("success", False),
                "response": result.get("response"),
                "error": result.get("error"),
                "metrics": {
                    "latencyMs": latency_ms,
                    "inputTokens": result.get("input_tokens", 0),
                    "outputTokens": result.get("output_tokens", 0),
                    "totalTokens": result.get("total_tokens", 0),
                    "model": model,
                    "provider": provider.name,
                },
                "renderedPrompt": rendered_prompt,
            }

        finally:
            await self.disconnect()

    def _render_prompt(self, template: str, data: Dict[str, Any]) -> str:
        """
        Render a prompt template with data.
        Supports simple {{variable}} substitution.
        """
        result = template

        for key, value in data.items():
            placeholder = "{{" + key + "}}"
            result = result.replace(placeholder, str(value) if value is not None else "")

        return result

    async def _execute_prompt(
        self,
        provider_name: str,
        api_key: str,
        model: str,
        prompt: str,
        max_tokens: int,
        temperature: float,
    ) -> Dict[str, Any]:
        """Execute a prompt against an LLM provider"""

        if provider_name == "anthropic":
            return await self._execute_anthropic(api_key, model, prompt, max_tokens, temperature)
        elif provider_name == "openai":
            return await self._execute_openai(api_key, model, prompt, max_tokens, temperature)
        elif provider_name == "gemini":
            return await self._execute_gemini(api_key, model, prompt, max_tokens, temperature)
        else:
            return {"success": False, "error": f"Unknown provider: {provider_name}"}

    async def _execute_anthropic(
        self,
        api_key: str,
        model: str,
        prompt: str,
        max_tokens: int,
        temperature: float,
    ) -> Dict[str, Any]:
        """Execute prompt with Anthropic"""
        try:
            client = anthropic.Anthropic(api_key=api_key)

            response = client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[{"role": "user", "content": prompt}]
            )

            return {
                "success": True,
                "response": response.content[0].text if response.content else "",
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
                "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _execute_openai(
        self,
        api_key: str,
        model: str,
        prompt: str,
        max_tokens: int,
        temperature: float,
    ) -> Dict[str, Any]:
        """Execute prompt with OpenAI"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                    },
                    timeout=120.0,
                )

                if response.status_code != 200:
                    return {"success": False, "error": f"API error: {response.status_code} - {response.text}"}

                data = response.json()
                usage = data.get("usage", {})

                return {
                    "success": True,
                    "response": data.get("choices", [{}])[0].get("message", {}).get("content", ""),
                    "input_tokens": usage.get("prompt_tokens", 0),
                    "output_tokens": usage.get("completion_tokens", 0),
                    "total_tokens": usage.get("total_tokens", 0),
                }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _execute_gemini(
        self,
        api_key: str,
        model: str,
        prompt: str,
        max_tokens: int,
        temperature: float,
    ) -> Dict[str, Any]:
        """Execute prompt with Gemini"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                    headers={"Content-Type": "application/json"},
                    params={"key": api_key},
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "maxOutputTokens": max_tokens,
                            "temperature": temperature,
                        },
                    },
                    timeout=120.0,
                )

                if response.status_code != 200:
                    return {"success": False, "error": f"API error: {response.status_code} - {response.text}"}

                data = response.json()
                text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")

                # Gemini doesn't return token counts in the same way
                usage = data.get("usageMetadata", {})

                return {
                    "success": True,
                    "response": text,
                    "input_tokens": usage.get("promptTokenCount", 0),
                    "output_tokens": usage.get("candidatesTokenCount", 0),
                    "total_tokens": usage.get("totalTokenCount", 0),
                }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def get_active_prompt_content(
        self,
        slug: str,
        context_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get the active prompt content for execution.
        Handles A/B experiment routing if an experiment is running.

        Returns dict with: content, provider_id, model, max_tokens, temperature, version_id
        """
        try:
            await self.connect()

            prompt = await self.prisma.prompt.find_unique(
                where={"slug": slug},
                include={
                    "versions": True,
                    "experiments": {
                        "where": {"status": ExperimentStatus.RUNNING}
                    },
                }
            )

            if not prompt:
                return None

            # Check for running experiments
            running_experiment = None
            if prompt.experiments:
                for exp in prompt.experiments:
                    if exp.status == ExperimentStatus.RUNNING:
                        running_experiment = exp
                        break

            version_id = None
            experiment_id = None

            if running_experiment:
                # Route based on traffic split using consistent hashing
                # Use context_id (e.g., deal_id) for consistent routing
                import hashlib
                hash_input = f"{running_experiment.id}:{context_id or ''}"
                hash_val = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
                ratio = (hash_val % 1000) / 1000.0

                if ratio < running_experiment.trafficSplit:
                    version_id = running_experiment.treatmentVersionId
                else:
                    version_id = running_experiment.controlVersionId

                experiment_id = running_experiment.id
            else:
                version_id = prompt.activeVersionId

            if not version_id:
                return None

            # Find the version
            version = None
            for v in prompt.versions:
                if v.id == version_id:
                    version = v
                    break

            if not version:
                return None

            return {
                "content": version.content,
                "provider_id": version.providerId or prompt.providerId,
                "model": version.model or prompt.model,
                "max_tokens": prompt.maxTokens,
                "temperature": prompt.temperature,
                "version_id": version.id,
                "prompt_id": prompt.id,
                "experiment_id": experiment_id,
            }

        finally:
            await self.disconnect()


def get_prompt_service() -> PromptService:
    """Get prompt service instance"""
    return PromptService()
