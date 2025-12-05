"""
AI-powered field mapper using Claude
Maps uploaded CSV columns to standard RevTrust fields
"""
import yaml
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from anthropic import Anthropic
import os


class FieldMapper:
    """AI-powered field mapping using Claude"""

    def __init__(self, config_path: str = None):
        """
        Initialize field mapper

        Args:
            config_path: Path to field-mappings.yaml
        """
        if config_path is None:
            base_path = Path(__file__).parent.parent.parent
            config_path = base_path / "config" / "field-mappings.yaml"

        self.config_path = Path(config_path)
        self.field_config = self._load_field_config()

        # Initialize Anthropic client (optional)
        try:
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if api_key:
                self.client = Anthropic(api_key=api_key)
            else:
                self.client = None
        except Exception:
            self.client = None

    def _load_field_config(self) -> Dict[str, Any]:
        """Load field mapping configuration from YAML"""
        with open(self.config_path, 'r') as f:
            return yaml.safe_load(f)

    def map_fields_with_ai(
        self,
        csv_headers: List[str],
        sample_data: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Use Claude to intelligently map CSV headers to standard fields

        Args:
            csv_headers: List of column names from uploaded CSV
            sample_data: Optional sample rows for context

        Returns:
            Dictionary with mapping results and confidence scores
        """
        # Check if AI client is available
        if not self.client:
            print("AI client not available, using rule-based mapping")
            return self._fallback_mapping(csv_headers)

        # Build the prompt for Claude
        prompt = self._build_mapping_prompt(csv_headers, sample_data)

        try:
            # Call Claude API
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            # Parse Claude's response
            mapping_result = self._parse_claude_response(response.content[0].text)

            # Add automatic mapping fallback for unmapped fields
            mapping_result = self._apply_fallback_mapping(
                csv_headers,
                mapping_result
            )

            return mapping_result

        except Exception as e:
            print(f"AI mapping failed: {str(e)}, falling back to rule-based")
            return self._fallback_mapping(csv_headers)

    def _build_mapping_prompt(
        self,
        csv_headers: List[str],
        sample_data: Optional[List[Dict[str, Any]]]
    ) -> str:
        """Build the prompt for Claude"""

        # Get standard field definitions
        standard_fields = {}
        for field_name, config in self.field_config['mappings'].items():
            standard_fields[field_name] = {
                'required': config.get('required', False),
                'data_type': config.get('data_type', 'string'),
                'description': config.get('description', ''),
                'aliases': config.get('aliases', [])
            }

        prompt = f"""You are a field mapping expert for CRM data. Your task is to map uploaded CSV column names to standard RevTrust fields.

Standard RevTrust Fields:
{json.dumps(standard_fields, indent=2)}

CSV Column Headers:
{json.dumps(csv_headers, indent=2)}
"""

        if sample_data:
            prompt += f"""
Sample Data (first 3 rows):
{json.dumps(sample_data[:3], indent=2)}
"""

        prompt += """
Please analyze the CSV headers (and sample data if provided) and create a mapping to the standard fields.

For each CSV column, determine:
1. Which standard field it maps to (or null if no good match)
2. Confidence score (0.0 to 1.0)
3. Reasoning for the mapping

Return ONLY a valid JSON object in this exact format:
{
  "mappings": {
    "csv_column_name": {
      "standard_field": "field_name or null",
      "confidence": 0.95,
      "reasoning": "explanation"
    }
  },
  "unmapped_required_fields": ["list", "of", "required", "fields", "not", "mapped"],
  "warnings": ["any warnings about the mapping"]
}

Important:
- Use exact CSV column names as keys in mappings
- Use exact standard field names (from the list above) or null
- Be conservative with confidence scores
- Flag any required fields that couldn't be mapped
"""

        return prompt

    def _parse_claude_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Claude's JSON response"""
        try:
            # Extract JSON from response (Claude sometimes adds explanation)
            start = response_text.find('{')
            end = response_text.rfind('}') + 1

            if start == -1 or end == 0:
                raise ValueError("No JSON found in response")

            json_str = response_text[start:end]
            result = json.loads(json_str)

            return result

        except Exception as e:
            raise ValueError(f"Failed to parse Claude response: {str(e)}")

    def _apply_fallback_mapping(
        self,
        csv_headers: List[str],
        ai_mapping: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply rule-based fallback for unmapped fields"""

        mappings = ai_mapping.get('mappings', {})

        # For any CSV headers not mapped by AI, try rule-based
        for header in csv_headers:
            if header not in mappings or mappings[header]['standard_field'] is None:
                matched_field, confidence = self._rule_based_match(header)
                if matched_field and confidence > 0.5:
                    mappings[header] = {
                        'standard_field': matched_field,
                        'confidence': confidence,
                        'reasoning': 'Rule-based fallback match'
                    }

        ai_mapping['mappings'] = mappings
        return ai_mapping

    def _rule_based_match(self, csv_header: str) -> tuple[Optional[str], float]:
        """Simple rule-based matching as fallback"""
        csv_lower = csv_header.lower().strip()

        best_match = None
        best_score = 0.0

        for field_name, config in self.field_config['mappings'].items():
            aliases = config.get('aliases', [])

            for alias in aliases:
                alias_lower = alias.lower()

                # Exact match
                if csv_lower == alias_lower:
                    return field_name, 1.0

                # Contains match
                if alias_lower in csv_lower or csv_lower in alias_lower:
                    score = 0.8
                    if score > best_score:
                        best_score = score
                        best_match = field_name

        return best_match, best_score

    def _fallback_mapping(self, csv_headers: List[str]) -> Dict[str, Any]:
        """Complete fallback to rule-based mapping if AI fails"""
        mappings = {}

        for header in csv_headers:
            matched_field, confidence = self._rule_based_match(header)
            mappings[header] = {
                'standard_field': matched_field,
                'confidence': confidence,
                'reasoning': 'Rule-based mapping (AI unavailable)'
            }

        # Check for required fields
        required_fields = [
            name for name, config in self.field_config['mappings'].items()
            if config.get('required', False)
        ]

        mapped_standard_fields = {
            m['standard_field'] for m in mappings.values()
            if m['standard_field'] is not None
        }

        unmapped_required = [
            f for f in required_fields
            if f not in mapped_standard_fields
        ]

        return {
            'mappings': mappings,
            'unmapped_required_fields': unmapped_required,
            'warnings': ['AI mapping unavailable, using rule-based fallback']
        }

    def apply_mapping(
        self,
        data: List[Dict[str, Any]],
        mapping: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Apply the field mapping to transform data

        Args:
            data: List of dicts with CSV column names as keys
            mapping: Mapping result from map_fields_with_ai()

        Returns:
            List of dicts with standard field names as keys
        """
        import uuid

        mapped_data = []
        field_mappings = mapping['mappings']

        for row in data:
            mapped_row = {}

            # Add unique ID for each deal
            mapped_row['id'] = str(uuid.uuid4())

            for csv_col, value in row.items():
                if csv_col in field_mappings:
                    mapping_info = field_mappings[csv_col]
                    standard_field = mapping_info.get('standard_field')

                    if standard_field:
                        # Apply data type conversion if needed
                        mapped_row[standard_field] = value

            mapped_data.append(mapped_row)

        return mapped_data

    def get_mapping_summary(self, mapping: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a summary of the mapping results"""
        mappings = mapping.get('mappings', {})

        total_columns = len(mappings)
        mapped_columns = sum(
            1 for m in mappings.values()
            if m.get('standard_field') is not None
        )
        high_confidence = sum(
            1 for m in mappings.values()
            if m.get('confidence', 0) >= 0.8
        )
        low_confidence = sum(
            1 for m in mappings.values()
            if m.get('standard_field') is not None and m.get('confidence', 0) < 0.6
        )

        return {
            'total_columns': total_columns,
            'mapped_columns': mapped_columns,
            'unmapped_columns': total_columns - mapped_columns,
            'high_confidence_mappings': high_confidence,
            'low_confidence_mappings': low_confidence,
            'unmapped_required_fields': mapping.get('unmapped_required_fields', []),
            'warnings': mapping.get('warnings', []),
        }
