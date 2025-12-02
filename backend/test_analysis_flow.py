"""
Test the complete analysis flow:
Parse CSV → Map Fields → Analyze Rules
"""
from app.utils.file_parser import FileParser, DataCleaner
from app.utils.field_mapper import FieldMapper
from app.utils.business_rules_engine import BusinessRulesEngine
from pathlib import Path


def test_complete_flow():
    print("=" * 80)
    print("Testing Complete Analysis Flow")
    print("=" * 80)
    print()

    # Load test CSV
    csv_path = Path(__file__).parent / "test_pipeline.csv"
    with open(csv_path, 'rb') as f:
        file_content = f.read()

    # Step 1: Parse CSV
    print("📄 Step 1: Parsing CSV...")
    parser = FileParser()
    raw_data, headers, metadata = parser.parse_file(file_content, "test_pipeline.csv")

    print(f"✅ Parsed {metadata['total_rows']} rows, {metadata['total_columns']} columns")
    print(f"   Headers: {headers}")
    print()

    # Clean data
    cleaned_data = DataCleaner.clean_data(raw_data)
    cleaned_data = DataCleaner.remove_empty_rows(cleaned_data)
    print(f"✅ Cleaned: {len(cleaned_data)} valid rows")
    print()

    # Step 2: Field Mapping
    print("🤖 Step 2: AI-Powered Field Mapping...")
    mapper = FieldMapper()

    # For this test, we'll use rule-based mapping (faster, no API call)
    mapping_result = mapper._fallback_mapping(headers)

    print("Field Mappings:")
    for csv_col, mapping_info in mapping_result['mappings'].items():
        std_field = mapping_info['standard_field']
        confidence = mapping_info['confidence']
        if std_field:
            print(f"  {csv_col} → {std_field} (confidence: {confidence:.2f})")
        else:
            print(f"  {csv_col} → [unmapped]")
    print()

    mapping_summary = mapper.get_mapping_summary(mapping_result)
    print(f"Summary: {mapping_summary['mapped_columns']}/{mapping_summary['total_columns']} columns mapped")
    if mapping_result.get('unmapped_required_fields'):
        print(f"⚠️  Missing required fields: {mapping_result['unmapped_required_fields']}")
    print()

    # Apply mapping
    mapped_data = mapper.apply_mapping(cleaned_data, mapping_result)
    print(f"✅ Transformed {len(mapped_data)} rows to standard format")
    print()

    # Step 3: Business Rules Analysis
    print("🔍 Step 3: Analyzing with Business Rules Engine...")
    engine = BusinessRulesEngine()
    results = engine.analyze_deals(mapped_data)

    print("=" * 80)
    print("📊 Analysis Results")
    print("=" * 80)
    print(f"Total deals: {results['total_deals']}")
    print(f"Deals with issues: {results['deals_with_issues']}")
    print(f"Health score: {results['health_score']}/100")
    print()
    print(f"Violations:")
    print(f"  Critical: {results['total_critical']}")
    print(f"  Warnings: {results['total_warnings']}")
    print(f"  Info: {results['total_info']}")
    print()

    # Show some violations
    if results['violations']:
        print("Sample Violations:")
        for v in results['violations'][:5]:
            print(f"  [{v['severity']}] {v['rule_name']}")
            print(f"    Deal: {v['deal_name'] or v['deal_id']}")
            print(f"    Message: {v['message']}")
            print()

    print("=" * 80)
    print("✅ Complete Flow Test Passed!")
    print("=" * 80)


if __name__ == "__main__":
    test_complete_flow()
