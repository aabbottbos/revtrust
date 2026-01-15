"""
Win/Loss Pattern Detection Routes
Endpoints for analyzing win/loss patterns
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from dataclasses import asdict
from prisma import Prisma
from app.services.winloss_service import WinLossPatternService
from app.services.subscription_service import get_subscription_service
from app.auth import get_current_user_id

router = APIRouter(prefix="/api/patterns", tags=["Win/Loss Patterns"])

# In-memory storage for POC (replace with database in production)
pattern_analysis_store: Dict[str, Any] = {}


@router.post("/analyze/{analysis_id}")
async def analyze_winloss_patterns(
    analysis_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Analyze win/loss patterns from closed deals
    Requires Pro subscription
    """

    # Check if user has AI access
    subscription_service = get_subscription_service()
    has_access = await subscription_service.check_ai_access(user_id)

    if not has_access:
        raise HTTPException(
            status_code=403,
            detail="Pattern detection requires Pro subscription. Upgrade at /pricing"
        )

    # Get deals from database
    db = Prisma()
    await db.connect()

    try:
        # Verify analysis exists and belongs to user
        analysis = await db.analysis.find_unique(
            where={"id": analysis_id},
            include={"user": True}
        )

        if not analysis:
            raise HTTPException(404, "Analysis not found")

        if analysis.userId != user_id:
            raise HTTPException(403, "Not authorized")

        # Get all deals for this analysis
        all_deals = await db.deal.find_many(
            where={"analysisId": analysis_id}
        )

        if not all_deals:
            raise HTTPException(400, "No deals found in analysis")

        # Separate closed and open deals
        closed_deals = [
            d for d in all_deals
            if d.dealStatus in ["won", "lost"]
        ]
        open_deals = [
            d for d in all_deals
            if d.dealStatus == "open" or d.dealStatus is None
        ]

        # Run pattern analysis
        service = WinLossPatternService()
        result = await service.analyze_patterns(
            analysis_id=analysis_id,
            deals=all_deals,
            open_deals=open_deals
        )

        # Convert dataclasses to dict for JSON serialization
        result_dict = {
            "analysis_id": result.analysis_id,
            "metrics": asdict(result.metrics),
            "win_patterns": [asdict(p) for p in result.win_patterns],
            "loss_patterns": [asdict(p) for p in result.loss_patterns],
            "insights": [asdict(i) for i in result.insights],
            "top_win_factors": result.top_win_factors,
            "top_loss_factors": result.top_loss_factors,
            "generated_at": result.generated_at,
            "status": "completed"
        }

        # Store in memory
        pattern_analysis_store[analysis_id] = result_dict

        return result_dict

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in pattern analysis: {e}")
        raise HTTPException(500, f"Pattern analysis failed: {str(e)}")
    finally:
        await db.disconnect()


@router.get("/analysis/{analysis_id}")
async def get_pattern_analysis(
    analysis_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get stored win/loss pattern analysis results
    """

    # Check if user has AI access
    subscription_service = get_subscription_service()
    has_access = await subscription_service.check_ai_access(user_id)

    if not has_access:
        raise HTTPException(
            status_code=403,
            detail="Pattern detection requires Pro subscription"
        )

    # Check in-memory store first
    if analysis_id in pattern_analysis_store:
        result = pattern_analysis_store[analysis_id]

        # Verify ownership through database
        db = Prisma()
        await db.connect()
        try:
            analysis = await db.analysis.find_unique(
                where={"id": analysis_id}
            )
            if not analysis or analysis.userId != user_id:
                raise HTTPException(403, "Not authorized")
        finally:
            await db.disconnect()

        return result

    # Not found in memory - may need to re-run analysis
    raise HTTPException(
        status_code=404,
        detail="Pattern analysis not found. Run POST /api/patterns/analyze/{analysis_id} first"
    )


@router.get("/analysis/{analysis_id}/summary")
async def get_pattern_summary(
    analysis_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get high-level summary of win/loss patterns
    """

    # Get full analysis
    full_result = await get_pattern_analysis(analysis_id, user_id)

    # Return condensed summary
    return {
        "analysis_id": analysis_id,
        "metrics": full_result["metrics"],
        "top_win_factors": full_result["top_win_factors"][:3],
        "top_loss_factors": full_result["top_loss_factors"][:3],
        "key_insights": [
            {
                "title": insight["title"],
                "description": insight["description"]
            }
            for insight in full_result["insights"][:3]
        ],
        "generated_at": full_result["generated_at"]
    }


@router.delete("/analysis/{analysis_id}")
async def delete_pattern_analysis(
    analysis_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete cached pattern analysis
    """

    # Verify ownership
    db = Prisma()
    await db.connect()
    try:
        analysis = await db.analysis.find_unique(
            where={"id": analysis_id}
        )
        if not analysis or analysis.userId != user_id:
            raise HTTPException(403, "Not authorized")
    finally:
        await db.disconnect()

    # Remove from store
    if analysis_id in pattern_analysis_store:
        del pattern_analysis_store[analysis_id]
        return {"message": "Pattern analysis deleted"}

    raise HTTPException(404, "Pattern analysis not found")
