"""
User profile management routes
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging

from app.auth import require_auth, get_current_user_email
from prisma import Prisma
from fastapi import Header

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/user", tags=["User Profile"])


class ProfileUpdateRequest(BaseModel):
    role: Optional[str] = None
    selling_motion: Optional[str] = None
    years_in_sales: Optional[str] = None
    sales_methodology: Optional[str] = None
    typical_sales_cycle: Optional[str] = None
    typical_deal_size: Optional[str] = None
    onboarding_completed: Optional[bool] = None


class RevenueTargetRequest(BaseModel):
    year: int
    quarter: int  # 1, 2, 3, or 4
    target: float
    set_by: str = "self"  # "self", "manager", "admin"


class TerritoryUpdateRequest(BaseModel):
    territory: Optional[str] = None
    industry: Optional[str] = None
    market_maturity: Optional[str] = None
    competition: Optional[str] = None


class ProductRequest(BaseModel):
    name: str
    typical_cycle: Optional[str] = None
    price_range: Optional[str] = None


class PreferencesUpdateRequest(BaseModel):
    coaching_style: Optional[str] = None
    notification_frequency: Optional[str] = None
    risk_tolerance: Optional[str] = None
    communication_tone: Optional[str] = None


@router.get("/profile")
async def get_profile(
    clerk_user_id: str = Depends(require_auth),
    authorization: str = Header(None)
):
    """Get user profile"""
    db = Prisma()
    await db.connect()

    try:
        # Look up user by clerkId (clerk_user_id is from JWT)
        user = await db.user.find_unique(where={"clerkId": clerk_user_id})

        # If user doesn't exist, create them
        if not user:
            logger.info(f"User not found in GET profile, creating new user: {clerk_user_id}")

            # Try to get email from Clerk token
            email = await get_current_user_email(authorization)
            if not email:
                email = f"{clerk_user_id}@temp.revtrust.net"
                logger.warning(f"Could not extract email from token, using placeholder: {email}")

            user = await db.user.create(
                data={
                    "clerkId": clerk_user_id,
                    "email": email,
                    "subscriptionTier": "free",
                    "subscriptionStatus": "active"
                }
            )
            logger.info(f"Created new user: {user.id} with email: {email}")

        return {
            "id": user.id,
            "email": user.email,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "role": user.role,
            "sellingMotion": user.sellingMotion,
            "yearsInSales": user.yearsInSales,
            "salesMethodology": user.salesMethodology,
            "typicalSalesCycle": user.typicalSalesCycle,
            "typicalDealSize": user.typicalDealSize,
            "onboardingCompleted": user.onboardingCompleted,
            "onboardingCompletedAt": user.onboardingCompletedAt.isoformat() if user.onboardingCompletedAt else None,
        }
    except Exception as e:
        logger.error(f"Error fetching profile for user {clerk_user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.disconnect()


@router.put("/profile")
async def update_profile(
    request: ProfileUpdateRequest,
    clerk_user_id: str = Depends(require_auth),
    authorization: str = Header(None)
):
    """Update user profile"""
    logger.info(f"Updating profile for user {clerk_user_id}")
    logger.info(f"Request data: {request.model_dump()}")

    db = Prisma()
    await db.connect()

    try:
        # Look up user by clerkId
        user = await db.user.find_unique(where={"clerkId": clerk_user_id})

        # If user doesn't exist, create them
        # This handles the case where Clerk created the user but we don't have a DB record yet
        if not user:
            logger.info(f"User not found in database, creating new user: {clerk_user_id}")

            # Try to get email from Clerk token
            email = await get_current_user_email(authorization)
            if not email:
                email = f"{clerk_user_id}@temp.revtrust.net"
                logger.warning(f"Could not extract email from token, using placeholder: {email}")

            user = await db.user.create(
                data={
                    "clerkId": clerk_user_id,
                    "email": email,
                    "subscriptionTier": "free",
                    "subscriptionStatus": "active"
                }
            )
            logger.info(f"Created new user: {user.id} with email: {email}")

        # Build update data
        update_data = {}

        if request.role is not None:
            update_data["role"] = request.role
        if request.selling_motion is not None:
            update_data["sellingMotion"] = request.selling_motion
        if request.years_in_sales is not None:
            update_data["yearsInSales"] = request.years_in_sales
        if request.sales_methodology is not None:
            update_data["salesMethodology"] = request.sales_methodology
        if request.typical_sales_cycle is not None:
            update_data["typicalSalesCycle"] = request.typical_sales_cycle
        if request.typical_deal_size is not None:
            update_data["typicalDealSize"] = request.typical_deal_size
        if request.onboarding_completed is not None:
            update_data["onboardingCompleted"] = request.onboarding_completed
            if request.onboarding_completed:
                update_data["onboardingCompletedAt"] = datetime.now()

        logger.info(f"Update data: {update_data}")

        # Update user using the database ID
        await db.user.update(
            where={"id": user.id},
            data=update_data
        )

        # Fetch updated user
        updated_user = await db.user.find_unique(where={"id": user.id})

        logger.info(f"Profile updated for user {clerk_user_id}")

        return {
            "success": True,
            "message": "Profile updated successfully",
            "user": {
                "id": updated_user.id if updated_user else user.id,
                "role": updated_user.role if updated_user else None,
                "sellingMotion": updated_user.sellingMotion if updated_user else None,
                "yearsInSales": updated_user.yearsInSales if updated_user else None,
                "salesMethodology": updated_user.salesMethodology if updated_user else None,
                "typicalSalesCycle": updated_user.typicalSalesCycle if updated_user else None,
                "typicalDealSize": updated_user.typicalDealSize if updated_user else None,
                "onboardingCompleted": updated_user.onboardingCompleted if updated_user else False,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile for user {clerk_user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.disconnect()


@router.post("/revenue-target")
async def set_revenue_target(
    request: RevenueTargetRequest,
    clerk_user_id: str = Depends(require_auth)
):
    """Set or update revenue target for a quarter"""
    db = Prisma()
    await db.connect()

    try:
        # Look up user by clerkId to get database user ID
        user = await db.user.find_unique(where={"clerkId": clerk_user_id})

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Validate quarter
        if request.quarter not in [1, 2, 3, 4]:
            raise HTTPException(status_code=400, detail="Quarter must be 1, 2, 3, or 4")

        # Validate year
        if request.year < 2020 or request.year > 2030:
            raise HTTPException(status_code=400, detail="Invalid year")

        # Validate target
        if request.target <= 0:
            raise HTTPException(status_code=400, detail="Target must be greater than 0")

        # Check if target already exists (use database user.id)
        existing = await db.revenuetarget.find_unique(
            where={
                "userId_year_quarter": {
                    "userId": user.id,
                    "year": request.year,
                    "quarter": request.quarter
                }
            }
        )

        if existing:
            # Update existing target
            target = await db.revenuetarget.update(
                where={"id": existing.id},
                data={
                    "target": request.target,
                    "setBy": request.set_by,
                }
            )
            logger.info(f"Updated revenue target for user {clerk_user_id}: Q{request.quarter} {request.year} = ${request.target}")
        else:
            # Create new target (use database user.id)
            target = await db.revenuetarget.create(
                data={
                    "userId": user.id,
                    "year": request.year,
                    "quarter": request.quarter,
                    "target": request.target,
                    "setBy": request.set_by,
                }
            )
            logger.info(f"Created revenue target for user {clerk_user_id}: Q{request.quarter} {request.year} = ${request.target}")

        return {
            "success": True,
            "message": "Revenue target saved successfully",
            "target": {
                "id": target.id,
                "year": target.year,
                "quarter": target.quarter,
                "target": target.target,
                "currency": target.currency,
                "setBy": target.setBy,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting revenue target for user {clerk_user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.disconnect()


@router.get("/revenue-targets")
async def get_revenue_targets(
    clerk_user_id: str = Depends(require_auth),
    authorization: str = Header(None)
):
    """Get all revenue targets for the user"""
    db = Prisma()
    await db.connect()

    try:
        # Look up user by clerkId to get database user ID
        user = await db.user.find_unique(where={"clerkId": clerk_user_id})

        # Auto-create user if they don't exist
        if not user:
            logger.info(f"User not found in GET revenue-targets, creating new user: {clerk_user_id}")

            email = await get_current_user_email(authorization)
            if not email:
                email = f"{clerk_user_id}@temp.revtrust.net"
                logger.warning(f"Could not extract email from token, using placeholder: {email}")

            user = await db.user.create(
                data={
                    "clerkId": clerk_user_id,
                    "email": email,
                    "subscriptionTier": "free",
                    "subscriptionStatus": "active"
                }
            )
            logger.info(f"Created new user: {user.id} with email: {email}")

        targets = await db.revenuetarget.find_many(
            where={"userId": user.id},
            order=[
                {"year": "desc"},
                {"quarter": "desc"}
            ]
        )

        return {
            "targets": [
                {
                    "id": t.id,
                    "year": t.year,
                    "quarter": t.quarter,
                    "target": t.target,
                    "currency": t.currency,
                    "setBy": t.setBy,
                    "createdAt": t.createdAt.isoformat(),
                    "updatedAt": t.updatedAt.isoformat(),
                }
                for t in targets
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching revenue targets for user {clerk_user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.disconnect()


@router.delete("/revenue-target/{target_id}")
async def delete_revenue_target(
    target_id: str,
    clerk_user_id: str = Depends(require_auth)
):
    """Delete a revenue target"""
    db = Prisma()
    await db.connect()

    try:
        # Look up user by clerkId to get database user ID
        user = await db.user.find_unique(where={"clerkId": clerk_user_id})

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify target belongs to user
        target = await db.revenuetarget.find_unique(where={"id": target_id})

        if not target:
            raise HTTPException(status_code=404, detail="Revenue target not found")

        if target.userId != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this target")

        # Delete target
        await db.revenuetarget.delete(where={"id": target_id})

        logger.info(f"Deleted revenue target {target_id} for user {clerk_user_id}")

        return {
            "success": True,
            "message": "Revenue target deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting revenue target {target_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.disconnect()


# ==================== TERRITORY ENDPOINTS ====================

@router.get("/territory")
async def get_territory(
    clerk_user_id: str = Depends(require_auth),
    authorization: str = Header(None)
):
    """Get user territory settings"""
    db = Prisma()
    await db.connect()

    try:
        user = await db.user.find_unique(where={"clerkId": clerk_user_id})

        # Auto-create user if they don't exist
        if not user:
            logger.info(f"User not found in GET territory, creating new user: {clerk_user_id}")

            email = await get_current_user_email(authorization)
            if not email:
                email = f"{clerk_user_id}@temp.revtrust.net"
                logger.warning(f"Could not extract email from token, using placeholder: {email}")

            user = await db.user.create(
                data={
                    "clerkId": clerk_user_id,
                    "email": email,
                    "subscriptionTier": "free",
                    "subscriptionStatus": "active"
                }
            )
            logger.info(f"Created new user: {user.id} with email: {email}")

        return {
            "territory": user.territory,
            "industry": user.industry,
            "marketMaturity": user.marketMaturity,
            "competition": user.competition,
        }
    except Exception as e:
        logger.error(f"Error fetching territory for user {clerk_user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.disconnect()


@router.put("/territory")
async def update_territory(
    request: TerritoryUpdateRequest,
    clerk_user_id: str = Depends(require_auth),
    authorization: str = Header(None)
):
    """Update user territory settings"""
    logger.info(f"Updating territory for user {clerk_user_id}")

    db = Prisma()
    await db.connect()

    try:
        user = await db.user.find_unique(where={"clerkId": clerk_user_id})

        # Auto-create user if they don't exist
        if not user:
            logger.info(f"User not found in database, creating new user: {clerk_user_id}")

            email = await get_current_user_email(authorization)
            if not email:
                email = f"{clerk_user_id}@temp.revtrust.net"
                logger.warning(f"Could not extract email from token, using placeholder: {email}")

            user = await db.user.create(
                data={
                    "clerkId": clerk_user_id,
                    "email": email,
                    "subscriptionTier": "free",
                    "subscriptionStatus": "active"
                }
            )
            logger.info(f"Created new user: {user.id} with email: {email}")

        # Build update data
        update_data = {}

        if request.territory is not None:
            update_data["territory"] = request.territory
        if request.industry is not None:
            update_data["industry"] = request.industry
        if request.market_maturity is not None:
            update_data["marketMaturity"] = request.market_maturity
        if request.competition is not None:
            update_data["competition"] = request.competition

        # Update user
        await db.user.update(
            where={"id": user.id},
            data=update_data
        )

        updated_user = await db.user.find_unique(where={"id": user.id})

        logger.info(f"Territory updated for user {clerk_user_id}")

        return {
            "success": True,
            "message": "Territory settings updated successfully",
            "territory": {
                "territory": updated_user.territory if updated_user else None,
                "industry": updated_user.industry if updated_user else None,
                "marketMaturity": updated_user.marketMaturity if updated_user else None,
                "competition": updated_user.competition if updated_user else None,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating territory for user {clerk_user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.disconnect()


# ==================== PRODUCTS ENDPOINTS ====================

@router.get("/products")
async def get_products(
    clerk_user_id: str = Depends(require_auth),
    authorization: str = Header(None)
):
    """Get all products for the user"""
    db = Prisma()
    await db.connect()

    try:
        user = await db.user.find_unique(where={"clerkId": clerk_user_id})

        # Auto-create user if they don't exist
        if not user:
            logger.info(f"User not found in GET products, creating new user: {clerk_user_id}")

            email = await get_current_user_email(authorization)
            if not email:
                email = f"{clerk_user_id}@temp.revtrust.net"
                logger.warning(f"Could not extract email from token, using placeholder: {email}")

            user = await db.user.create(
                data={
                    "clerkId": clerk_user_id,
                    "email": email,
                    "subscriptionTier": "free",
                    "subscriptionStatus": "active"
                }
            )
            logger.info(f"Created new user: {user.id} with email: {email}")

        products = await db.product.find_many(
            where={"userId": user.id},
            order=[{"createdAt": "desc"}]
        )

        return {
            "products": [
                {
                    "id": p.id,
                    "name": p.name,
                    "typicalCycle": p.typicalCycle,
                    "priceRange": p.priceRange,
                    "createdAt": p.createdAt.isoformat(),
                    "updatedAt": p.updatedAt.isoformat(),
                }
                for p in products
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching products for user {clerk_user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.disconnect()


@router.post("/product")
async def create_product(
    request: ProductRequest,
    clerk_user_id: str = Depends(require_auth)
):
    """Create a new product"""
    db = Prisma()
    await db.connect()

    try:
        user = await db.user.find_unique(where={"clerkId": clerk_user_id})

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Validate name
        if not request.name.strip():
            raise HTTPException(status_code=400, detail="Product name is required")

        # Create product
        product = await db.product.create(
            data={
                "userId": user.id,
                "name": request.name,
                "typicalCycle": request.typical_cycle,
                "priceRange": request.price_range,
            }
        )

        logger.info(f"Created product for user {clerk_user_id}: {request.name}")

        return {
            "success": True,
            "message": "Product created successfully",
            "product": {
                "id": product.id,
                "name": product.name,
                "typicalCycle": product.typicalCycle,
                "priceRange": product.priceRange,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating product for user {clerk_user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.disconnect()


@router.delete("/product/{product_id}")
async def delete_product(
    product_id: str,
    clerk_user_id: str = Depends(require_auth)
):
    """Delete a product"""
    db = Prisma()
    await db.connect()

    try:
        user = await db.user.find_unique(where={"clerkId": clerk_user_id})

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify product belongs to user
        product = await db.product.find_unique(where={"id": product_id})

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        if product.userId != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this product")

        # Delete product
        await db.product.delete(where={"id": product_id})

        logger.info(f"Deleted product {product_id} for user {clerk_user_id}")

        return {
            "success": True,
            "message": "Product deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting product {product_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.disconnect()


# ==================== PREFERENCES ENDPOINTS ====================

@router.get("/preferences")
async def get_preferences(
    clerk_user_id: str = Depends(require_auth),
    authorization: str = Header(None)
):
    """Get user preferences"""
    db = Prisma()
    await db.connect()

    try:
        user = await db.user.find_unique(where={"clerkId": clerk_user_id})

        # Auto-create user if they don't exist
        if not user:
            logger.info(f"User not found in GET preferences, creating new user: {clerk_user_id}")

            email = await get_current_user_email(authorization)
            if not email:
                email = f"{clerk_user_id}@temp.revtrust.net"
                logger.warning(f"Could not extract email from token, using placeholder: {email}")

            user = await db.user.create(
                data={
                    "clerkId": clerk_user_id,
                    "email": email,
                    "subscriptionTier": "free",
                    "subscriptionStatus": "active"
                }
            )
            logger.info(f"Created new user: {user.id} with email: {email}")

        return {
            "coachingStyle": user.coachingStyle,
            "notificationFrequency": user.notificationFrequency,
            "riskTolerance": user.riskTolerance,
            "communicationTone": user.communicationTone,
        }
    except Exception as e:
        logger.error(f"Error fetching preferences for user {clerk_user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.disconnect()


@router.put("/preferences")
async def update_preferences(
    request: PreferencesUpdateRequest,
    clerk_user_id: str = Depends(require_auth),
    authorization: str = Header(None)
):
    """Update user preferences"""
    logger.info(f"Updating preferences for user {clerk_user_id}")

    db = Prisma()
    await db.connect()

    try:
        user = await db.user.find_unique(where={"clerkId": clerk_user_id})

        # Auto-create user if they don't exist
        if not user:
            logger.info(f"User not found in database, creating new user: {clerk_user_id}")

            email = await get_current_user_email(authorization)
            if not email:
                email = f"{clerk_user_id}@temp.revtrust.net"
                logger.warning(f"Could not extract email from token, using placeholder: {email}")

            user = await db.user.create(
                data={
                    "clerkId": clerk_user_id,
                    "email": email,
                    "subscriptionTier": "free",
                    "subscriptionStatus": "active"
                }
            )
            logger.info(f"Created new user: {user.id} with email: {email}")

        # Build update data
        update_data = {}

        if request.coaching_style is not None:
            update_data["coachingStyle"] = request.coaching_style
        if request.notification_frequency is not None:
            update_data["notificationFrequency"] = request.notification_frequency
        if request.risk_tolerance is not None:
            update_data["riskTolerance"] = request.risk_tolerance
        if request.communication_tone is not None:
            update_data["communicationTone"] = request.communication_tone

        # Update user
        await db.user.update(
            where={"id": user.id},
            data=update_data
        )

        updated_user = await db.user.find_unique(where={"id": user.id})

        logger.info(f"Preferences updated for user {clerk_user_id}")

        return {
            "success": True,
            "message": "Preferences updated successfully",
            "preferences": {
                "coachingStyle": updated_user.coachingStyle if updated_user else None,
                "notificationFrequency": updated_user.notificationFrequency if updated_user else None,
                "riskTolerance": updated_user.riskTolerance if updated_user else None,
                "communicationTone": updated_user.communicationTone if updated_user else None,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating preferences for user {clerk_user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await db.disconnect()
