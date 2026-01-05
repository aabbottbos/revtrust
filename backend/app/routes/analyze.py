"""
Analysis endpoint for processing pipeline CSV uploads with background processing
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.responses import StreamingResponse
from typing import Dict, Any, Optional, Literal
import traceback
import uuid
import asyncio
from datetime import datetime, timezone
from prisma import Prisma

from app.utils.file_parser import FileParser, DataCleaner
from app.utils.field_mapper import FieldMapper
from app.utils.business_rules_engine import BusinessRulesEngine
from app.utils.export_generator import get_export_generator
from app.utils.file_validator import FileValidator
from app.auth import get_current_user_id
from app.utils.user_manager import get_user_manager


router = APIRouter()

# In-memory storage for analysis status (use Redis/database in production)
analysis_status_store: Dict[str, Dict[str, Any]] = {}


async def process_analysis_background(
    analysis_id: str,
    file_content: bytes,
    filename: str,
    user_id: str
):
    """
    Background task to process CSV and run business rules.
    Updates status as it progresses.
    """
    try:
        # Step 1: Parse file
        analysis_status_store[analysis_id] = {
            "status": "processing",
            "progress": 15,
            "current_step": "Reading pipeline data...",
            "user_id": user_id,
            "filename": filename,
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }

        await asyncio.sleep(0.3)  # Small delay for UX

        parser = FileParser()
        raw_data, headers, metadata = parser.parse_file(file_content, filename)

        # Step 2: Clean data
        analysis_status_store[analysis_id] = {
            "status": "processing",
            "progress": 30,
            "current_step": "Validating deal information...",
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }

        await asyncio.sleep(0.3)

        cleaned_data = DataCleaner.clean_data(raw_data)
        cleaned_data = DataCleaner.remove_empty_rows(cleaned_data)

        if not cleaned_data:
            raise ValueError("No valid data found in file after cleaning")

        # Step 3: Field mapping
        analysis_status_store[analysis_id] = {
            "status": "processing",
            "progress": 50,
            "current_step": "Mapping fields to standard format...",
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }

        await asyncio.sleep(0.3)

        mapper = FieldMapper()
        mapping_result = mapper.map_fields_with_ai(
            csv_headers=headers,
            sample_data=cleaned_data[:5]
        )

        mapping_summary = mapper.get_mapping_summary(mapping_result)
        mapped_data = mapper.apply_mapping(cleaned_data, mapping_result)

        # Debug: Check what was mapped
        print(f"📊 Mapped Data Debug:")
        print(f"  - Input rows: {len(cleaned_data)}")
        print(f"  - Mapped rows: {len(mapped_data)}")
        print(f"  - Mapping summary: {mapping_summary}")
        if mapped_data and len(mapped_data) > 0:
            print(f"  - First mapped row: {mapped_data[0]}")
            print(f"  - First mapped row keys: {list(mapped_data[0].keys())}")
        else:
            print(f"  - WARNING: mapped_data is empty or contains empty dicts!")

        # Step 4: Run business rules
        analysis_status_store[analysis_id] = {
            "status": "processing",
            "progress": 75,
            "current_step": "Running business rules analysis...",
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }

        await asyncio.sleep(0.3)

        engine = BusinessRulesEngine()
        analysis_results = engine.analyze_deals(mapped_data)

        # Step 5: Complete
        analysis_status_store[analysis_id] = {
            "status": "processing",
            "progress": 95,
            "current_step": "Finalizing results...",
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }

        await asyncio.sleep(0.2)

        # Build final result
        result = {
            "status": "success",
            "file_info": {
                "filename": filename,
                "total_rows": metadata['total_rows'],
                "total_columns": metadata['total_columns'],
                "valid_rows": len(cleaned_data),
            },
            "field_mapping": {
                "summary": mapping_summary,
                "mappings": mapping_result['mappings'],
                "warnings": mapping_result.get('warnings', []),
            },
            "analysis": {
                "health_score": analysis_results['health_score'],
                "total_deals": analysis_results['total_deals'],
                "deals_with_issues": analysis_results['deals_with_issues'],
                "total_critical": analysis_results['total_critical'],
                "total_warnings": analysis_results['total_warnings'],
                "total_info": analysis_results['total_info'],
            },
            "deals": mapped_data,  # Store the deals data for AI analysis
            "violations": analysis_results['violations'],
            "violations_by_category": analysis_results['violations_by_category'],
            "violations_by_severity": analysis_results['violations_by_severity'],
        }

        # Mark as complete
        analysis_status_store[analysis_id] = {
            "status": "completed",
            "progress": 100,
            "current_step": "Analysis complete!",
            "user_id": user_id,
            "filename": filename,
            "result": result,
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }

        print(f"✅ Analysis {analysis_id} completed successfully for user {user_id}")

    except Exception as e:
        # Mark as failed
        print(f"❌ Analysis {analysis_id} failed: {str(e)}")
        print(traceback.format_exc())

        analysis_status_store[analysis_id] = {
            "status": "failed",
            "progress": 0,
            "current_step": "Analysis failed",
            "user_id": user_id,
            "filename": filename,
            "error": str(e),
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }


@router.post("/analyze")
async def analyze_pipeline(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Start analysis of uploaded CSV/XLSX file with comprehensive validation.
    Returns analysis_id immediately and processes in background.

    The frontend can poll /api/analysis/{analysis_id}/status to track progress.
    """
    try:
        # Read file content
        file_content = await file.read()

        # Validate file metadata
        FileValidator.validate_file_metadata(file.filename, len(file_content))

        # Validate file content (parse and check structure)
        # This also serves as an early check before background processing
        try:
            FileValidator.validate_file_content(file_content, file.filename)
        except HTTPException:
            # Re-raise validation errors
            raise
        except Exception as e:
            # Catch any unexpected errors during validation
            print(f"Unexpected validation error: {e}")
            raise HTTPException(
                500,
                "An unexpected error occurred while validating your file. Please try again."
            )

        # Generate unique analysis ID
        analysis_id = str(uuid.uuid4())

        # Initialize status with user association
        analysis_status_store[analysis_id] = {
            "status": "pending",
            "progress": 0,
            "current_step": "Starting analysis...",
            "user_id": user_id,
            "filename": file.filename,
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }

        # Start background processing
        background_tasks.add_task(
            process_analysis_background,
            analysis_id,
            file_content,
            file.filename,
            user_id
        )

        print(f"🚀 Started analysis {analysis_id} for file: {file.filename} (user: {user_id})")

        return {
            "analysis_id": analysis_id,
            "filename": file.filename,
            "status": "pending"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error starting analysis: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start analysis: {str(e)}"
        )


@router.get("/analysis/{analysis_id}/status")
async def get_analysis_status(analysis_id: str) -> Dict[str, Any]:
    """
    Get current status of an analysis.
    Frontend polls this endpoint to track progress.
    """
    if analysis_id not in analysis_status_store:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found"
        )

    status_data = analysis_status_store[analysis_id]

    # Return status without result (for polling)
    return {
        "status": status_data["status"],
        "progress": status_data["progress"],
        "current_step": status_data["current_step"],
        "updated_at": status_data["updated_at"],
        "error": status_data.get("error")
    }


@router.get("/analysis/{analysis_id}")
async def get_analysis_result(analysis_id: str) -> Dict[str, Any]:
    """
    Get complete analysis results with formatted data for UI.
    Only available after analysis is complete.
    Checks both in-memory store (manual uploads) and database (scheduled reviews).
    """
    # First, check in-memory store for manual uploads
    if analysis_id in analysis_status_store:
        status_data = analysis_status_store[analysis_id]

        if status_data["status"] == "failed":
            raise HTTPException(
                status_code=500,
                detail=f"Analysis failed: {status_data.get('error', 'Unknown error')}"
            )

        if status_data["status"] != "completed":
            raise HTTPException(
                status_code=400,
                detail=f"Analysis not complete. Current status: {status_data['status']}"
            )

        result = status_data.get("result", {})
    else:
        # Not in memory, check database for scheduled review runs
        prisma = Prisma()
        await prisma.connect()

        try:
            # Try to find as a ReviewRun by analysisId
            review_run = await prisma.reviewrun.find_first(
                where={"analysisId": analysis_id},
                include={"scheduledReview": True}
            )

            # Also try to find by the ReviewRun's own ID
            if not review_run:
                review_run = await prisma.reviewrun.find_unique(
                    where={"id": analysis_id},
                    include={"scheduledReview": True}
                )

            if not review_run or review_run.status != "completed":
                raise HTTPException(
                    status_code=404,
                    detail="Analysis not found or not completed"
                )

            # Build a result structure compatible with manual uploads
            # For scheduled reviews, we don't have detailed violations stored in DB,
            # so we'll return a summary-only view
            result = {
                "file_info": {
                    "filename": f"{review_run.scheduledReview.name} (Scheduled)",
                    "total_rows": review_run.dealsAnalyzed or 0,
                    "total_columns": 0,
                    "valid_rows": review_run.dealsAnalyzed or 0,
                },
                "analysis": {
                    "health_score": float(review_run.healthScore or 0),
                    "total_deals": review_run.dealsAnalyzed or 0,
                    "deals_with_issues": review_run.issuesFound or 0,
                    "total_critical": 0,
                    "total_warnings": 0,
                    "total_info": 0,
                },
                "violations": [],
                "violations_by_category": {},
                "violations_by_severity": {},
            }

            status_data = {
                "updated_at": (review_run.completedAt.isoformat() + "Z") if review_run.completedAt else (review_run.startedAt.isoformat() + "Z")
            }
        finally:
            await prisma.disconnect()

    result = status_data.get("result", {}) if "result" in status_data else result

    # Calculate enhanced health metrics
    total_deals = result.get("analysis", {}).get("total_deals", 0)
    deals_with_issues = result.get("analysis", {}).get("deals_with_issues", 0)
    deals_without_issues = total_deals - deals_with_issues

    # Calculate percentage with issues
    percentage_with_issues = 0
    if total_deals > 0:
        percentage_with_issues = round((deals_with_issues / total_deals) * 100, 1)

    # Determine health status and color
    if percentage_with_issues <= 25:
        health_status = "excellent"
        health_color = "#10B981"  # Green
    elif percentage_with_issues <= 50:
        health_status = "good"
        health_color = "#F59E0B"  # Yellow
    elif percentage_with_issues <= 75:
        health_status = "fair"
        health_color = "#F97316"  # Orange
    else:
        health_status = "poor"
        health_color = "#EF4444"  # Red

    # Group violations by deal for easier frontend consumption
    violations_by_deal = {}
    for violation in result.get("violations", []):
        deal_id = violation.get("deal_id") or violation.get("deal_name", "Unknown")
        if deal_id not in violations_by_deal:
            violations_by_deal[deal_id] = []
        violations_by_deal[deal_id].append(violation)

    # Group violations by category for the issues table
    # Normalize severity to lowercase for consistent comparison
    issues_by_category_dict = {}
    for violation in result.get("violations", []):
        rule_name = violation.get("rule_name", "Unknown")
        severity = violation.get("severity", "info").lower()  # Normalize to lowercase

        if rule_name not in issues_by_category_dict:
            issues_by_category_dict[rule_name] = {
                "category": rule_name,
                "count": 0,
                "severity": severity,
                "sample_violation": {
                    "rule_name": rule_name,
                    "message": violation.get("message", "")
                }
            }
        issues_by_category_dict[rule_name]["count"] += 1

    # Sort by severity then count
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    issues_by_category = sorted(
        issues_by_category_dict.values(),
        key=lambda x: (severity_order.get(x["severity"], 3), -x["count"])
    )

    # =========================================
    # ISSUES VIEW AGGREGATIONS
    # Group by issue type for issues-centric view
    # =========================================
    issues_summary = []
    for rule_name, data in issues_by_category_dict.items():
        # Find all deals affected by this issue type
        affected_deals = set()
        for violation in result.get("violations", []):
            if violation.get("rule_name") == rule_name:
                deal_id = violation.get("deal_id") or violation.get("deal_name", "Unknown")
                affected_deals.add(deal_id)

        issues_summary.append({
            "issue_type": rule_name,
            "severity": data["severity"],  # Already normalized to lowercase
            "total_occurrences": data["count"],
            "affected_deals_count": len(affected_deals),
            "affected_deal_ids": list(affected_deals),
            "sample_message": data["sample_violation"]["message"],
            "category": result.get("violations_by_category", {}).get(rule_name, {}).get("category", "UNKNOWN"),
        })

    # Sort issues by severity, then by count
    issues_summary.sort(
        key=lambda x: (severity_order.get(x["severity"], 3), -x["total_occurrences"])
    )

    # =========================================
    # DEALS VIEW AGGREGATIONS
    # Group by deal for deals-centric view
    # =========================================
    deals_summary = []
    for deal_id, deal_violations in violations_by_deal.items():
        # Use case-insensitive comparison for severity (config uses UPPERCASE, we normalize to lowercase)
        critical_count = sum(1 for v in deal_violations if v.get("severity", "").lower() == "critical")
        warning_count = sum(1 for v in deal_violations if v.get("severity", "").lower() == "warning")
        info_count = sum(1 for v in deal_violations if v.get("severity", "").lower() == "info")

        # Determine deal severity (highest wins)
        if critical_count > 0:
            deal_severity = "critical"
        elif warning_count > 0:
            deal_severity = "warning"
        else:
            deal_severity = "info"

        # Get deal metadata from first violation
        first_violation = deal_violations[0] if deal_violations else {}

        deals_summary.append({
            "deal_id": deal_id,
            "deal_name": first_violation.get("deal_name", deal_id),
            "account_name": first_violation.get("account_name"),
            "amount": first_violation.get("amount"),
            "stage": first_violation.get("stage"),
            "close_date": first_violation.get("close_date"),
            "severity": deal_severity,
            "total_issues": len(deal_violations),
            "critical_count": critical_count,
            "warning_count": warning_count,
            "info_count": info_count,
            "issue_types": list(set(v.get("rule_name", "Unknown") for v in deal_violations)),
        })

    # Sort deals by severity, then by issue count
    deals_summary.sort(
        key=lambda x: (severity_order.get(x["severity"], 3), -x["total_issues"])
    )

    # Count totals
    total_issues = len(result.get("violations", []))
    critical_issues = result.get("analysis", {}).get("total_critical", 0)
    warning_issues = result.get("analysis", {}).get("total_warnings", 0)
    info_issues = result.get("analysis", {}).get("total_info", 0)

    # Return enhanced result
    return {
        "analysis_id": analysis_id,
        "file_name": result.get("file_info", {}).get("filename", "Unknown"),
        "analyzed_at": status_data.get("updated_at"),
        "total_deals": total_deals,
        "deals_with_issues": deals_with_issues,
        "deals_without_issues": deals_without_issues,
        "percentage_with_issues": percentage_with_issues,
        "health_score": result.get("analysis", {}).get("health_score", 0),
        "health_status": health_status,
        "health_color": health_color,
        # Issue counts
        "total_issues": total_issues,
        "critical_issues": critical_issues,
        "warning_issues": warning_issues,
        "info_issues": info_issues,
        # Views data
        "issues_by_category": issues_by_category,
        "issues_summary": issues_summary,  # For issues view
        "deals_summary": deals_summary,    # For deals view
        # Raw data
        "violations": result.get("violations", []),
        "violations_by_deal": violations_by_deal,
        "violations_by_category": result.get("violations_by_category", {}),
        "violations_by_severity": result.get("violations_by_severity", {}),
        "file_info": result.get("file_info", {}),
        "field_mapping": result.get("field_mapping", {}),
        # Legacy fields for backward compatibility
        "filename": result.get("file_info", {}).get("filename", "Unknown"),
    }


@router.get("/analyze/service/status")
async def get_service_status() -> Dict[str, Any]:
    """Get status of the analysis service"""
    try:
        # Load rules engine to verify it's working
        engine = BusinessRulesEngine()
        rules_summary = engine.get_rules_summary()

        return {
            "status": "operational",
            "rules_loaded": rules_summary['total_rules'],
            "categories": list(rules_summary['by_category'].keys()),
            "active_analyses": len(analysis_status_store)
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


@router.get("/analysis/{analysis_id}/deals")
async def get_deals_with_issues(
    analysis_id: str,
    severity: Optional[Literal["all", "critical", "warning", "info"]] = "all",
    skip: int = 0,
    limit: int = 100
):
    """
    Get deals with issues, optionally filtered by severity.
    Supports pagination.
    """
    if analysis_id not in analysis_status_store:
        raise HTTPException(404, "Analysis not found")

    status = analysis_status_store[analysis_id]

    if status["status"] != "completed":
        raise HTTPException(400, "Analysis not complete")

    result = status.get("result", {})
    violations_by_deal = {}

    # Build violations_by_deal from violations list
    for violation in result.get("violations", []):
        deal_key = violation.get("deal_name") or violation.get("deal_id", "Unknown")
        if deal_key not in violations_by_deal:
            violations_by_deal[deal_key] = []
        violations_by_deal[deal_key].append(violation)

    # Build list of deals with their violations
    deals_list = []

    for deal_id, violations in violations_by_deal.items():
        # Filter by severity if specified
        if severity != "all":
            violations = [
                v for v in violations
                if v.get("severity", "").lower() == severity.lower()
            ]

            # Skip deals with no matching violations
            if not violations:
                continue

        # Count by severity
        critical_count = sum(1 for v in violations if v.get("severity", "").lower() == "critical")
        warning_count = sum(1 for v in violations if v.get("severity", "").lower() == "warning")
        info_count = sum(1 for v in violations if v.get("severity", "").lower() == "info")

        # Determine overall severity (highest severity wins)
        if critical_count > 0:
            overall_severity = "critical"
        elif warning_count > 0:
            overall_severity = "warning"
        else:
            overall_severity = "info"

        deals_list.append({
            "deal_id": deal_id,
            "deal_name": deal_id,
            "violations": violations,
            "violation_count": len(violations),
            "critical_count": critical_count,
            "warning_count": warning_count,
            "info_count": info_count,
            "overall_severity": overall_severity,
        })

    # Sort by severity (critical first, then warnings, then info)
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    deals_list.sort(key=lambda x: severity_order.get(x["overall_severity"], 99))

    # Pagination
    total = len(deals_list)
    deals_paginated = deals_list[skip:skip + limit]

    return {
        "deals": deals_paginated,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": skip + limit < total,
    }


@router.get("/analysis/{analysis_id}/deals/{deal_id}")
async def get_deal_details(analysis_id: str, deal_id: str):
    """
    Get detailed information about a specific deal.
    """
    if analysis_id not in analysis_status_store:
        raise HTTPException(404, "Analysis not found")

    status = analysis_status_store[analysis_id]

    if status["status"] != "completed":
        raise HTTPException(400, "Analysis not complete")

    result = status.get("result", {})

    # Find violations for this deal
    violations = [
        v for v in result.get("violations", [])
        if (v.get("deal_name") == deal_id or v.get("deal_id") == deal_id)
    ]

    if not violations:
        raise HTTPException(404, "Deal not found")

    # Count by severity
    critical_count = sum(1 for v in violations if v.get("severity", "").lower() == "critical")
    warning_count = sum(1 for v in violations if v.get("severity", "").lower() == "warning")
    info_count = sum(1 for v in violations if v.get("severity", "").lower() == "info")

    # Group violations by category
    violations_by_category = {}
    for violation in violations:
        category = violation.get("category", "UNKNOWN")
        if category not in violations_by_category:
            violations_by_category[category] = []
        violations_by_category[category].append(violation)

    return {
        "deal_id": deal_id,
        "deal_name": deal_id,
        "violations": violations,
        "violations_by_category": violations_by_category,
        "critical_count": critical_count,
        "warning_count": warning_count,
        "info_count": info_count,
        "total_violations": len(violations),
    }


@router.get("/history")
async def get_user_history(
    user_id: str = Depends(get_current_user_id),
    skip: int = 0,
    limit: int = 20
):
    """
    Get analysis history for current user.
    Returns list of completed analyses (both manual uploads and scheduled reviews).
    """
    # Filter analyses for this user that are completed
    user_analyses = []

    for analysis_id, status in analysis_status_store.items():
        # Check if analysis belongs to user and is completed
        if status.get("user_id") == user_id and status.get("status") == "completed":
            result = status.get("result", {})
            analysis_data = result.get("analysis", {})

            user_analyses.append({
                "analysis_id": analysis_id,
                "filename": status.get("filename", result.get("file_info", {}).get("filename", "Unknown")),
                "total_deals": analysis_data.get("total_deals", 0),
                "deals_with_issues": analysis_data.get("deals_with_issues", 0),
                "health_score": analysis_data.get("health_score", 0),
                "health_status": result.get("health_status", "unknown"),
                "analyzed_at": status.get("updated_at"),
                "source": "manual",
            })

    # Add completed scheduled reviews
    prisma = Prisma()
    await prisma.connect()

    try:
        # Get user to find actual ID
        user = await prisma.user.find_unique(
            where={"clerkId": user_id}
        )

        if user:
            # Get all completed review runs for this user's scheduled reviews
            runs = await prisma.reviewrun.find_many(
                where={
                    "status": "completed",
                    "scheduledReview": {
                        "userId": user.id
                    }
                },
                include={
                    "scheduledReview": True
                },
                order={
                    "completedAt": "desc"
                }
            )

            for run in runs:
                # Calculate health status from score
                health_score = run.healthScore or 0
                if health_score >= 80:
                    health_status = "excellent"
                elif health_score >= 60:
                    health_status = "good"
                elif health_score >= 40:
                    health_status = "fair"
                else:
                    health_status = "poor"

                user_analyses.append({
                    "analysis_id": run.analysisId or run.id,
                    "filename": f"{run.scheduledReview.name} (Scheduled)",
                    "total_deals": run.dealsAnalyzed or 0,
                    "deals_with_issues": run.issuesFound or 0,
                    "health_score": health_score,
                    "health_status": health_status,
                    "analyzed_at": (run.completedAt.isoformat() + "Z") if run.completedAt else (run.startedAt.isoformat() + "Z"),
                    "source": "scheduled",
                    "schedule_name": run.scheduledReview.name,
                })
    finally:
        await prisma.disconnect()

    # Sort by date (newest first)
    user_analyses.sort(key=lambda x: x["analyzed_at"], reverse=True)

    # Pagination
    total = len(user_analyses)
    paginated = user_analyses[skip:skip + limit]

    return {
        "analyses": paginated,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/analysis/{analysis_id}/export/csv")
async def export_analysis_csv(
    analysis_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Export analysis results as CSV file.
    Returns downloadable CSV.
    """
    if analysis_id not in analysis_status_store:
        raise HTTPException(404, "Analysis not found")

    status = analysis_status_store[analysis_id]

    # Verify user owns this analysis
    if status.get("user_id") != user_id:
        raise HTTPException(403, "Access denied")

    if status["status"] != "completed":
        raise HTTPException(400, "Analysis not complete")

    result = status.get("result", {})

    # Build the analysis result in the format expected by export_generator
    violations_by_deal = {}
    for violation in result.get("violations", []):
        deal_key = violation.get("deal_name") or violation.get("deal_id", "Unknown")
        if deal_key not in violations_by_deal:
            violations_by_deal[deal_key] = []
        violations_by_deal[deal_key].append(violation)

    export_data = {
        "violations_by_deal": violations_by_deal
    }

    # Generate CSV
    generator = get_export_generator()
    csv_content = generator.generate_csv(export_data)

    # Create filename
    filename = result.get("file_info", {}).get("filename", "pipeline")
    clean_filename = filename.replace(".csv", "").replace(".xlsx", "")
    export_filename = f"revtrust-{clean_filename}-{datetime.now().strftime('%Y%m%d')}.csv"

    # Return as downloadable file
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={export_filename}"
        }
    )


@router.get("/analysis/{analysis_id}/export/summary")
async def export_analysis_summary(
    analysis_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get text summary for clipboard.
    Returns plain text.
    """
    if analysis_id not in analysis_status_store:
        raise HTTPException(404, "Analysis not found")

    status = analysis_status_store[analysis_id]

    # Verify user owns this analysis
    if status.get("user_id") != user_id:
        raise HTTPException(403, "Access denied")

    if status["status"] != "completed":
        raise HTTPException(400, "Analysis not complete")

    result = status.get("result", {})

    # Build violations_by_deal from violations list
    violations_by_deal = {}
    for violation in result.get("violations", []):
        deal_key = violation.get("deal_name") or violation.get("deal_id", "Unknown")
        if deal_key not in violations_by_deal:
            violations_by_deal[deal_key] = []
        violations_by_deal[deal_key].append(violation)

    # Build summary data
    analysis_data = result.get("analysis", {})
    summary_data = {
        "filename": result.get("file_info", {}).get("filename", "Unknown"),
        "total_deals": analysis_data.get("total_deals", 0),
        "deals_with_issues": analysis_data.get("deals_with_issues", 0),
        "health_score": analysis_data.get("health_score", 0),
        "critical_issues": analysis_data.get("total_critical", 0),
        "warning_issues": analysis_data.get("total_warnings", 0),
        "violations_by_deal": violations_by_deal
    }

    # Generate summary
    generator = get_export_generator()
    summary = generator.generate_summary_text(summary_data)

    return {
        "summary": summary
    }
