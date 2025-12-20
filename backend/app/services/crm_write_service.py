"""
Service for writing deal updates to Salesforce and HubSpot.
"""

from typing import Dict, Any, List, Optional
from datetime import date, datetime
from simple_salesforce import Salesforce
from hubspot import HubSpot
from prisma import Prisma

from app.models.crm_write import (
    DealUpdateRequest,
    DealUpdateResponse,
)
from app.services.encryption_service import get_encryption_service
from app.services.salesforce_service import get_salesforce_service
from app.services.hubspot_service import get_hubspot_service


class CRMWriteService:
    """
    Handles writing deal updates to CRM systems.
    """

    def __init__(self):
        self.encryption = get_encryption_service()
        self.sf_service = get_salesforce_service()
        self.hs_service = get_hubspot_service()

    async def update_deal(
        self,
        user_id: str,
        update: DealUpdateRequest
    ) -> DealUpdateResponse:
        """
        Update a single deal in the user's connected CRM.
        """
        prisma = Prisma()
        await prisma.connect()

        try:
            # Get user's CRM connection
            connection = await prisma.crmconnection.find_first(
                where={
                    "userId": user_id,
                    "provider": update.crm_type,
                    "isActive": True
                }
            )

            if not connection:
                return DealUpdateResponse(
                    success=False,
                    crm_deal_id=update.crm_deal_id,
                    updated_fields=[],
                    errors=[{"code": "NO_CONNECTION", "message": f"No active {update.crm_type} connection"}]
                )

            if update.crm_type == "salesforce":
                return await self._update_salesforce_deal(
                    connection_id=connection.id,
                    update=update
                )
            elif update.crm_type == "hubspot":
                return await self._update_hubspot_deal(
                    connection_id=connection.id,
                    update=update
                )
            else:
                return DealUpdateResponse(
                    success=False,
                    crm_deal_id=update.crm_deal_id,
                    updated_fields=[],
                    errors=[{"code": "UNSUPPORTED_CRM", "message": f"CRM type {update.crm_type} not supported"}]
                )

        finally:
            await prisma.disconnect()

    async def _update_salesforce_deal(
        self,
        connection_id: str,
        update: DealUpdateRequest
    ) -> DealUpdateResponse:
        """
        Update an Opportunity in Salesforce.
        """
        # Map our fields to Salesforce field names
        sf_field_mapping = {
            "close_date": "CloseDate",
            "stage": "StageName",
            "amount": "Amount",
            "next_step": "NextStep",
            "probability": "Probability",
            "description": "Description",
        }

        # Build update payload
        payload = {}
        updated_fields = []

        for our_field, sf_field in sf_field_mapping.items():
            value = getattr(update, our_field, None)
            if value is not None:
                # Format dates as strings for Salesforce
                if isinstance(value, date):
                    payload[sf_field] = value.isoformat()
                else:
                    payload[sf_field] = value
                updated_fields.append(our_field)

        # Add any custom fields
        if update.custom_fields:
            payload.update(update.custom_fields)
            updated_fields.extend(update.custom_fields.keys())

        if not payload:
            return DealUpdateResponse(
                success=True,
                crm_deal_id=update.crm_deal_id,
                updated_fields=[],
                errors=[{"code": "NO_CHANGES", "message": "No fields to update"}]
            )

        try:
            # Get valid token and instance URL
            access_token, instance_url = await self.sf_service.get_valid_token(connection_id)

            # Initialize Salesforce client
            sf = Salesforce(
                instance_url=instance_url,
                session_id=access_token
            )

            # Update the opportunity
            print(f"Updating Salesforce Opportunity {update.crm_deal_id} with: {payload}")
            sf.Opportunity.update(update.crm_deal_id, payload)

            return DealUpdateResponse(
                success=True,
                crm_deal_id=update.crm_deal_id,
                updated_fields=updated_fields,
            )

        except Exception as e:
            print(f"Salesforce update error: {e}")
            return DealUpdateResponse(
                success=False,
                crm_deal_id=update.crm_deal_id,
                updated_fields=[],
                errors=[{
                    "code": "SF_ERROR",
                    "message": str(e),
                }]
            )

    async def _update_hubspot_deal(
        self,
        connection_id: str,
        update: DealUpdateRequest
    ) -> DealUpdateResponse:
        """
        Update a Deal in HubSpot.
        """
        # Map our fields to HubSpot property names
        hs_field_mapping = {
            "close_date": "closedate",
            "stage": "dealstage",
            "amount": "amount",
            "next_step": "notes_next_step_date",  # HubSpot uses different field
            "description": "description",
        }

        # Build update payload
        properties = {}
        updated_fields = []

        for our_field, hs_field in hs_field_mapping.items():
            value = getattr(update, our_field, None)
            if value is not None:
                # HubSpot expects closedate as Unix timestamp in milliseconds
                if our_field == "close_date" and isinstance(value, date):
                    dt = datetime.combine(value, datetime.min.time())
                    properties[hs_field] = int(dt.timestamp() * 1000)
                else:
                    properties[hs_field] = value
                updated_fields.append(our_field)

        # Add any custom fields
        if update.custom_fields:
            properties.update(update.custom_fields)
            updated_fields.extend(update.custom_fields.keys())

        if not properties:
            return DealUpdateResponse(
                success=True,
                crm_deal_id=update.crm_deal_id,
                updated_fields=[],
            )

        try:
            # Get valid token
            access_token = await self.hs_service.get_valid_token(connection_id)

            # Initialize HubSpot client
            client = HubSpot(access_token=access_token)

            # Update the deal
            print(f"Updating HubSpot Deal {update.crm_deal_id} with: {properties}")
            from hubspot.crm.deals import SimplePublicObjectInput
            deal_input = SimplePublicObjectInput(properties=properties)
            result = client.crm.deals.basic_api.update(
                deal_id=update.crm_deal_id,
                simple_public_object_input=deal_input
            )

            return DealUpdateResponse(
                success=True,
                crm_deal_id=update.crm_deal_id,
                updated_fields=updated_fields,
                crm_response={"id": result.id}
            )

        except Exception as e:
            print(f"HubSpot update error: {e}")
            return DealUpdateResponse(
                success=False,
                crm_deal_id=update.crm_deal_id,
                updated_fields=[],
                errors=[{
                    "code": "HS_ERROR",
                    "message": str(e),
                }]
            )


def get_crm_write_service() -> CRMWriteService:
    """Get CRM write service instance"""
    return CRMWriteService()
