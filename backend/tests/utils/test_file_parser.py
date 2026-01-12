
import pytest
from app.utils.file_parser import FileParser
import pandas as pd
import io

@pytest.fixture
def parser():
    return FileParser()

def test_parse_csv_simple(parser):
    content = b"col1,col2\nval1,val2"
    data, headers, metadata = parser.parse_file(content, "test.csv")
    
    assert len(data) == 1
    assert data[0]['col1'] == 'val1'
    assert data[0]['col2'] == 'val2'
    assert headers == ['col1', 'col2']
    assert metadata['total_rows'] == 1

def test_parse_csv_encoding(parser):
    # Latin-1 content
    content = "col1,col2\nval1,résumé".encode('latin-1')
    data, headers, metadata = parser.parse_file(content, "test.csv")
    
    assert data[0]['col2'] == 'résumé'

def test_parse_excel_simple(parser):
    df = pd.DataFrame({'col1': ['val1'], 'col2': ['val2']})
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    content = output.getvalue()
    
    data, headers, metadata = parser.parse_file(content, "test.xlsx")
    
    assert len(data) == 1
    assert data[0]['col1'] == 'val1'
    assert headers == ['col1', 'col2']

def test_unsupported_file_type(parser):
    with pytest.raises(ValueError, match="Unsupported file type"):
        parser.parse_file(b"data", "test.txt")

def test_empty_file(parser):
    with pytest.raises(ValueError):
        parser.parse_file(b"", "test.csv")

def test_clean_column_names(parser):
    # Test duplicate handling and cleaning
    # Create DF with duplicates explicitly
    df = pd.DataFrame([[1, 2, 3]], columns=['col 1', 'col 1', 'Unnamed: 0'])
    df.columns = parser._clean_column_names(df.columns)
    
    assert 'col 1' in df.columns
    assert 'col 1_1' in df.columns # Duplicate handled
    assert 'column_3' in df.columns # Unnamed handled

def test_detect_header_row(parser):
    # Row 0: Metadata
    # Row 1: Headers (Name, Amount, Stage)
    # Row 2: Data
    df = pd.DataFrame([
        ['Report Generated', 'Draft', ''],
        ['Name', 'Amount', 'Stage'],
        ['Deal 1', 100, 'Won']
    ])
    
    header_idx = parser._detect_header_row(df)
    assert header_idx == 1
