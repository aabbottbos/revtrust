"""
AI Analysis Routes
Endpoints for AI-powered deal insights
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from app.services.ai_service import get_ai_service, AIAnalysisResult
from app.services.subscription_service import get_subscription_service
from app.auth import get_current_user_id

router = APIRouter(prefix="/api/ai", tags=["AI Analysis"])

# In-memory storage for POC (replace with database in production)
ai_analysis_store: Dict[str, Any] = {}


@router.post("/analyze/{analysis_id}")
async def run_ai_analysis(
    analysis_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Run AI analysis on a completed business rules analysis
    Requires Pro subscription
    """

    # Check if user has AI access
    subscription_service = get_subscription_service()
    has_access = await subscription_service.check_ai_access(user_id)

    if not has_access:
        raise HTTPException(
            status_code=403,
            detail="AI features require Pro subscription. Upgrade at /pricing"
        )

    # Get original analysis from store
    from app.routes.analyze import analysis_status_store

    if analysis_id not in analysis_status_store:
        raise HTTPException(404, "Analysis not found")

    analysis = analysis_status_store[analysis_id]

    # Verify ownership
    if analysis.get("user_id") != user_id:
        raise HTTPException(403, "Not authorized")

    if analysis["status"] != "completed":
        raise HTTPException(400, "Analysis must be completed first")

    # Check if AI analysis already exists
    if analysis_id in ai_analysis_store:
        return {
            "status": "completed",
            "message": "AI analysis already exists",
            "ai_analysis_id": analysis_id
        }

    # Get deals and violations
    deals = analysis.get("deals", [])
    violations = analysis.get("violations", [])

    # Group violations by deal
    violations_by_deal: Dict[str, List[Dict]] = {}
    for violation in violations:
        deal_id = violation.get("deal_id")
        if deal_id not in violations_by_deal:
            violations_by_deal[deal_id] = []
        violations_by_deal[deal_id].append(violation)

    # Run AI analysis
    try:
        ai_service = get_ai_service()

        # Analyze all deals
        results = await ai_service.analyze_pipeline(deals, violations_by_deal)

        # Generate pipeline summary
        pipeline_summary = await ai_service.generate_pipeline_summary(deals, results)

        # Calculate additional metrics
        avg_risk_score = sum(r.risk_score for r in results) / len(results) if results else 0
        critical_actions = sum(1 for r in results if r.action_priority == 'critical')

        # Store results with enhanced data
        ai_analysis_store[analysis_id] = {
            "analysis_id": analysis_id,
            "user_id": user_id,
            "status": "completed",
            "pipeline_summary": pipeline_summary,
            "metrics": {
                "total_deals_analyzed": len(results),
                "average_risk_score": round(avg_risk_score, 1),
                "high_risk_count": sum(1 for r in results if r.risk_level == "high"),
                "medium_risk_count": sum(1 for r in results if r.risk_level == "medium"),
                "low_risk_count": sum(1 for r in results if r.risk_level == "low"),
                "critical_actions_needed": critical_actions
            },
            "results": [
                {
                    "deal_id": r.deal_id,
                    "deal_name": r.deal_name,
                    "deal_amount": next((d.get('amount', 0) for d in deals if d.get('id') == r.deal_id), 0),
                    "risk_score": r.risk_score,
                    "risk_level": r.risk_level,
                    "risk_factors": r.risk_factors,
                    "next_best_action": r.next_best_action,
                    "action_priority": r.action_priority,
                    "action_rationale": r.action_rationale,
                    "executive_summary": r.executive_summary,
                    "confidence": r.confidence
                }
                for r in results
            ]
        }

        return {
            "status": "completed",
            "message": "AI analysis completed successfully",
            "ai_analysis_id": analysis_id,
            "deals_analyzed": len(results),
            "average_risk_score": round(avg_risk_score, 1),
            "critical_actions": critical_actions
        }

    except Exception as e:
        print(f"AI analysis error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"AI analysis failed: {str(e)}")


@router.get("/analysis/{analysis_id}")
async def get_ai_analysis(
    analysis_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get AI analysis results"""

    if analysis_id not in ai_analysis_store:
        raise HTTPException(404, "AI analysis not found")

    ai_analysis = ai_analysis_store[analysis_id]

    # Verify ownership
    if ai_analysis.get("user_id") != user_id:
        raise HTTPException(403, "Not authorized")

    return ai_analysis


@router.get("/analysis/{analysis_id}/summary")
async def get_pipeline_summary(
    analysis_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get AI-generated pipeline summary"""

    if analysis_id not in ai_analysis_store:
        raise HTTPException(404, "AI analysis not found")

    ai_analysis = ai_analysis_store[analysis_id]

    # Verify ownership
    if ai_analysis.get("user_id") != user_id:
        raise HTTPException(403, "Not authorized")

    return {
        "summary": ai_analysis.get("pipeline_summary", {}),
        "metrics": ai_analysis.get("metrics", {})
    }


@router.get("/analysis/{analysis_id}/top-risks")
async def get_top_risks(
    analysis_id: str,
    limit: int = 3,
    user_id: str = Depends(get_current_user_id)
):
    """Get top N riskiest deals"""

    if analysis_id not in ai_analysis_store:
        raise HTTPException(404, "AI analysis not found")

    ai_analysis = ai_analysis_store[analysis_id]

    # Verify ownership
    if ai_analysis.get("user_id") != user_id:
        raise HTTPException(403, "Not authorized")

    # Sort by risk score and get top N
    results = ai_analysis.get("results", [])
    top_risks = sorted(
        results,
        key=lambda x: x["risk_score"],
        reverse=True
    )[:limit]

    return {
        "top_risks": top_risks,
        "count": len(top_risks)
    }
