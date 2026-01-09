"""
Admin routes for LLM provider and prompt management
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth import get_current_user_id
from app.services.llm_provider_service import (
    get_llm_provider_service,
    ProviderCreate,
    ProviderUpdate,
    ProviderResponse,
)
from app.services.prompt_service import (
    get_prompt_service,
    PromptUpdate,
    VersionCreate,
    PromptTestRequest,
    PromptResponse,
    PromptVersionResponse,
)
from app.services.experiment_service import (
    get_experiment_service,
    ExperimentCreate,
    ExperimentUpdate,
    ExperimentResponse,
    ExperimentResults,
)

router = APIRouter(prefix="/api/admin/prompts", tags=["Admin - Prompts"])


# ============================================================
# Helper function for admin check
# TODO: Implement proper admin role checking once user roles are defined
# ============================================================

async def require_admin(user_id: str) -> str:
    """
    Check if user is an admin.
    For now, we allow all authenticated users.
    TODO: Implement proper admin role checking.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    # TODO: Check if user has admin role
    # For now, allow all authenticated users in development
    return user_id


# ============================================================
# LLM Provider Routes
# ============================================================

@router.get("/providers", response_model=List[ProviderResponse])
async def list_providers(
    user_id: str = Depends(get_current_user_id)
):
    """List all configured LLM providers"""
    await require_admin(user_id)
    
    service = get_llm_provider_service()
    return await service.list_providers()


@router.get("/providers/{provider_id}", response_model=ProviderResponse)
async def get_provider(
    provider_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific provider by ID"""
    await require_admin(user_id)
    
    service = get_llm_provider_service()
    provider = await service.get_provider(provider_id)
    
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found"
        )
    
    return provider


@router.post("/providers", response_model=ProviderResponse, status_code=status.HTTP_201_CREATED)
async def create_provider(
    data: ProviderCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new LLM provider configuration"""
    await require_admin(user_id)
    
    # Validate provider name
    valid_providers = ["anthropic", "openai", "gemini"]
    if data.name.lower() not in valid_providers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid provider name. Must be one of: {', '.join(valid_providers)}"
        )
    
    service = get_llm_provider_service()
    
    # Check if provider already exists
    existing = await service.get_provider_by_name(data.name.lower())
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Provider '{data.name}' already exists"
        )
    
    return await service.create_provider(data, user_id)


@router.patch("/providers/{provider_id}", response_model=ProviderResponse)
async def update_provider(
    provider_id: str,
    data: ProviderUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update an existing provider"""
    await require_admin(user_id)
    
    service = get_llm_provider_service()
    provider = await service.update_provider(provider_id, data)
    
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found"
        )
    
    return provider


@router.delete("/providers/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider(
    provider_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a provider"""
    await require_admin(user_id)
    
    service = get_llm_provider_service()
    success = await service.delete_provider(provider_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found"
        )


@router.post("/providers/{provider_id}/test")
async def test_provider(
    provider_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Test a provider's API connection"""
    await require_admin(user_id)
    
    service = get_llm_provider_service()
    result = await service.test_provider(provider_id)
    
    return result


# ============================================================
# Prompt Routes
# ============================================================

@router.get("/", response_model=List[PromptResponse])
async def list_prompts(
    category: Optional[str] = None,
    include_versions: bool = False,
    user_id: str = Depends(get_current_user_id)
):
    """List all prompts, optionally filtered by category"""
    await require_admin(user_id)

    service = get_prompt_service()
    return await service.list_prompts(category, include_versions)


# ============================================================
# Experiment Routes (must be before /{slug} to avoid conflicts)
# ============================================================

@router.get("/experiments", response_model=List[ExperimentResponse])
async def list_experiments(
    prompt_id: Optional[str] = None,
    status: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    """List all experiments"""
    await require_admin(user_id)
    
    service = get_experiment_service()
    return await service.list_experiments(prompt_id, status)


@router.get("/experiments/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment(
    experiment_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific experiment"""
    await require_admin(user_id)
    
    service = get_experiment_service()
    experiment = await service.get_experiment(experiment_id)
    
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found"
        )
    
    return experiment


@router.post("/experiments", response_model=ExperimentResponse, status_code=status.HTTP_201_CREATED)
async def create_experiment(
    data: ExperimentCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new A/B experiment"""
    await require_admin(user_id)
    
    service = get_experiment_service()
    
    try:
        return await service.create_experiment(data, user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/experiments/{experiment_id}", response_model=ExperimentResponse)
async def update_experiment(
    experiment_id: str,
    data: ExperimentUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update an experiment (name, description, traffic split, status)"""
    await require_admin(user_id)
    
    service = get_experiment_service()
    
    try:
        experiment = await service.update_experiment(experiment_id, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found"
        )
    
    return experiment


@router.post("/experiments/{experiment_id}/start", response_model=ExperimentResponse)
async def start_experiment(
    experiment_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Start an experiment"""
    await require_admin(user_id)
    
    service = get_experiment_service()
    
    try:
        experiment = await service.start_experiment(experiment_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found"
        )
    
    return experiment


@router.post("/experiments/{experiment_id}/stop", response_model=ExperimentResponse)
async def stop_experiment(
    experiment_id: str,
    mark_completed: bool = True,
    user_id: str = Depends(get_current_user_id)
):
    """Stop an experiment"""
    await require_admin(user_id)
    
    service = get_experiment_service()
    experiment = await service.stop_experiment(experiment_id, mark_completed)
    
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found"
        )
    
    return experiment


@router.get("/experiments/{experiment_id}/results", response_model=ExperimentResults)
async def get_experiment_results(
    experiment_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get detailed results for an experiment"""
    await require_admin(user_id)
    
    service = get_experiment_service()
    results = await service.get_experiment_results(experiment_id)
    
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found"
        )
    
    return results


@router.delete("/experiments/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experiment(
    experiment_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete an experiment"""
    await require_admin(user_id)
    
    service = get_experiment_service()
    
    try:
        success = await service.delete_experiment(experiment_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiment not found"
        )


# ============================================================
# Prompt Slug Routes (must be AFTER /experiments to avoid conflicts)
# ============================================================

@router.get("/{slug}", response_model=PromptResponse)
async def get_prompt(
    slug: str,
    include_versions: bool = False,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific prompt by slug"""
    await require_admin(user_id)

    service = get_prompt_service()
    prompt = await service.get_prompt_by_slug(slug, include_versions)

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    return prompt


@router.patch("/{slug}", response_model=PromptResponse)
async def update_prompt(
    slug: str,
    data: PromptUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update a prompt's configuration (not content - use versions for that)"""
    await require_admin(user_id)

    service = get_prompt_service()
    prompt = await service.update_prompt(slug, data)

    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    return prompt


@router.post("/{slug}/versions", response_model=PromptVersionResponse, status_code=status.HTTP_201_CREATED)
async def create_version(
    slug: str,
    data: VersionCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new version of a prompt"""
    await require_admin(user_id)

    service = get_prompt_service()

    try:
        version = await service.create_version(slug, data, user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    return version


@router.get("/{slug}/versions", response_model=List[PromptVersionResponse])
async def list_versions(
    slug: str,
    user_id: str = Depends(get_current_user_id)
):
    """List all versions of a prompt"""
    await require_admin(user_id)

    service = get_prompt_service()
    versions = await service.list_versions(slug)

    if versions is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )

    return versions


@router.post("/{slug}/test")
async def test_prompt(
    slug: str,
    data: PromptTestRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Test a prompt with sample data"""
    await require_admin(user_id)

    service = get_prompt_service()

    try:
        result = await service.test_prompt(slug, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    return result