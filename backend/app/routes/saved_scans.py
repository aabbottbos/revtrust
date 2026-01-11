"""
Routes for managing saved scans (Pro feature)
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from prisma import Prisma
from datetime import datetime
import uuid
import logging

from app.auth import get_current_user_id, get_current_user_email
from app.routes.scan import process_crm_scan_background
from app.routes.analyze import analysis_status_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/saved-scans", tags=["Saved Scans"])


class CreateSavedScanRequest(BaseModel):
    name: str
    description: Optional[str] = None
    source_type: str = "crm"
    crm_connection_id: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None


class UpdateSavedScanRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None


async def get_or_create_user(prisma: Prisma, clerk_id: str, email: Optional[str] = None):
    """Get user by Clerk ID or create if doesn't exist"""
    user = await prisma.user.find_unique(where={"clerkId": clerk_id})

    if not user:
        user_email = email or f"{clerk_id}@clerk.user"
        user = await prisma.user.create(data={
            "clerkId": clerk_id,
            "email": user_email
        })

    return user


async def require_pro_subscription(prisma: Prisma, user_id: str):
    """Check if user has Pro subscription for saved scans feature"""
    user = await prisma.user.find_unique(where={"id": user_id})

    if not user:
        raise HTTPException(404, "User not found")

    tier = user.subscriptionTier or "free"
    if tier not in ["pro", "team", "enterprise"]:
        raise HTTPException(
            403,
            "Saved scans require a Pro subscription. Upgrade at /pricing"
        )


@router.get("")
async def list_saved_scans(
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """List user's saved scans"""

    prisma = Prisma()
    await prisma.connect()

    try:
        user = await get_or_create_user(prisma, user_id, email)

        # Get saved scans with CRM connection info
        saved_scans = await prisma.savedscan.find_many(
            where={"userId": user.id},
            include={"crmConnection": True},
            order={"updatedAt": "desc"}
        )

        return {
            "saved_scans": [
                {
                    "id": scan.id,
                    "name": scan.name,
                    "description": scan.description,
                    "source_type": scan.sourceType,
                    "crm_connection_id": scan.crmConnectionId,
                    "crm_provider": scan.crmConnection.provider if scan.crmConnection else None,
                    "crm_account": scan.crmConnection.accountName if scan.crmConnection else None,
                    "filters": scan.filters,
                    "created_at": scan.createdAt.isoformat() + "Z",
                    "updated_at": scan.updatedAt.isoformat() + "Z",
                    "last_used_at": scan.lastUsedAt.isoformat() + "Z" if scan.lastUsedAt else None
                }
                for scan in saved_scans
            ]
        }

    finally:
        await prisma.disconnect()


@router.post("")
async def create_saved_scan(
    request: CreateSavedScanRequest,
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """Create a new saved scan (Pro feature)"""

    prisma = Prisma()
    await prisma.connect()

    try:
        user = await get_or_create_user(prisma, user_id, email)

        # Check subscription
        await require_pro_subscription(prisma, user.id)

        # Verify CRM connection if provided
        if request.crm_connection_id:
            connection = await prisma.crmconnection.find_first(
                where={
                    "id": request.crm_connection_id,
                    "userId": user.id,
                    "isActive": True
                }
            )
            if not connection:
                raise HTTPException(404, "CRM connection not found")

        # Create saved scan
        import json
        saved_scan = await prisma.savedscan.create(
            data={
                "user": {"connect": {"id": user.id}},
                "name": request.name,
                "description": request.description,
                "sourceType": request.source_type,
                "crmConnection": {"connect": {"id": request.crm_connection_id}} if request.crm_connection_id else None,
                "filters": json.dumps(request.filters) if request.filters else None
            },
            include={"crmConnection": True}
        )

        return {
            "id": saved_scan.id,
            "name": saved_scan.name,
            "description": saved_scan.description,
            "source_type": saved_scan.sourceType,
            "crm_connection_id": saved_scan.crmConnectionId,
            "crm_provider": saved_scan.crmConnection.provider if saved_scan.crmConnection else None,
            "crm_account": saved_scan.crmConnection.accountName if saved_scan.crmConnection else None,
            "created_at": saved_scan.createdAt.isoformat() + "Z"
        }

    finally:
        await prisma.disconnect()


@router.get("/{scan_id}")
async def get_saved_scan(
    scan_id: str,
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """Get a specific saved scan"""

    prisma = Prisma()
    await prisma.connect()

    try:
        user = await get_or_create_user(prisma, user_id, email)

        saved_scan = await prisma.savedscan.find_first(
            where={
                "id": scan_id,
                "userId": user.id
            },
            include={"crmConnection": True}
        )

        if not saved_scan:
            raise HTTPException(404, "Saved scan not found")

        return {
            "id": saved_scan.id,
            "name": saved_scan.name,
            "description": saved_scan.description,
            "source_type": saved_scan.sourceType,
            "crm_connection_id": saved_scan.crmConnectionId,
            "crm_provider": saved_scan.crmConnection.provider if saved_scan.crmConnection else None,
            "crm_account": saved_scan.crmConnection.accountName if saved_scan.crmConnection else None,
            "filters": saved_scan.filters,
            "created_at": saved_scan.createdAt.isoformat() + "Z",
            "updated_at": saved_scan.updatedAt.isoformat() + "Z",
            "last_used_at": saved_scan.lastUsedAt.isoformat() + "Z" if saved_scan.lastUsedAt else None
        }

    finally:
        await prisma.disconnect()


@router.put("/{scan_id}")
async def update_saved_scan(
    scan_id: str,
    request: UpdateSavedScanRequest,
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """Update a saved scan"""

    prisma = Prisma()
    await prisma.connect()

    try:
        user = await get_or_create_user(prisma, user_id, email)

        # Verify ownership
        saved_scan = await prisma.savedscan.find_first(
            where={
                "id": scan_id,
                "userId": user.id
            }
        )

        if not saved_scan:
            raise HTTPException(404, "Saved scan not found")

        # Build update data
        import json
        update_data = {}
        if request.name is not None:
            update_data["name"] = request.name
        if request.description is not None:
            update_data["description"] = request.description
        if request.filters is not None:
            update_data["filters"] = json.dumps(request.filters)

        # Update
        updated_scan = await prisma.savedscan.update(
            where={"id": scan_id},
            data=update_data
        )

        return {"status": "updated", "id": updated_scan.id}

    finally:
        await prisma.disconnect()


@router.delete("/{scan_id}")
async def delete_saved_scan(
    scan_id: str,
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """Delete a saved scan"""

    prisma = Prisma()
    await prisma.connect()

    try:
        user = await get_or_create_user(prisma, user_id, email)

        # Verify ownership
        saved_scan = await prisma.savedscan.find_first(
            where={
                "id": scan_id,
                "userId": user.id
            }
        )

        if not saved_scan:
            raise HTTPException(404, "Saved scan not found")

        # Delete
        await prisma.savedscan.delete(where={"id": scan_id})

        return {"status": "deleted"}

    finally:
        await prisma.disconnect()


@router.post("/{scan_id}/run")
async def run_saved_scan(
    scan_id: str,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """Run a saved scan (Pro feature)"""

    prisma = Prisma()
    await prisma.connect()

    try:
        user = await get_or_create_user(prisma, user_id, email)

        # Check subscription
        await require_pro_subscription(prisma, user.id)

        # Get saved scan
        saved_scan = await prisma.savedscan.find_first(
            where={
                "id": scan_id,
                "userId": user.id
            },
            include={"crmConnection": True}
        )

        if not saved_scan:
            raise HTTPException(404, "Saved scan not found")

        if not saved_scan.crmConnectionId or not saved_scan.crmConnection:
            raise HTTPException(400, "Saved scan has no CRM connection configured")

        if not saved_scan.crmConnection.isActive:
            raise HTTPException(400, "CRM connection is inactive")

        # Generate analysis ID
        analysis_id = str(uuid.uuid4())

        # Initialize status in memory store
        analysis_status_store[analysis_id] = {
            "status": "pending",
            "progress": 0,
            "current_step": "Starting saved scan...",
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "user_id": user_id,
            "filename": f"{saved_scan.name}",
            "source": "saved_scan",
            "saved_scan_id": scan_id
        }

        # Update last used timestamp
        await prisma.savedscan.update(
            where={"id": scan_id},
            data={"lastUsedAt": datetime.utcnow()}
        )

        # Start background processing (reuse CRM scan logic)
        background_tasks.add_task(
            process_crm_scan_background,
            analysis_id=analysis_id,
            connection_id=saved_scan.crmConnectionId,
            user_id=user_id,
            user_db_id=user.id
        )

        return {
            "analysis_id": analysis_id,
            "status": "pending",
            "message": f"Started scan: {saved_scan.name}"
        }

    finally:
        await prisma.disconnect()
