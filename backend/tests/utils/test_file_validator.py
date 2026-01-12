
import pytest
from fastapi import HTTPException
from app.utils.file_validator import FileValidator
import pandas as pd
import io

@pytest.fixture
def validator():
    return FileValidator()

def test_validate_metadata_valid(validator):
    # Should not raise
    validator.validate_file_metadata("test.csv", 1000)

def test_validate_metadata_invalid_ext(validator):
    with pytest.raises(HTTPException, match="Invalid file type"):
        validator.validate_file_metadata("test.txt", 1000)

def test_validate_metadata_too_large(validator):
    with pytest.raises(HTTPException, match="File is too large"):
        validator.validate_file_metadata("test.csv", 30 * 1024 * 1024) # 30MB

def test_validate_content_valid(validator):
    df = pd.DataFrame({'col1': [1], 'col2': [2], 'col3': [3]})
    output = io.BytesIO()
    df.to_csv(output, index=False)
    content = output.getvalue()
    
    # Should return dataframe
    result = validator.validate_file_content(content, "test.csv")
    assert isinstance(result, pd.DataFrame)
    assert len(result) == 1

def test_validate_content_empty_result(validator):
    # CSV with headers but no data
    content = b"col1,col2\n"
    with pytest.raises(HTTPException, match="File contains no data rows"):
        validator.validate_file_content(content, "test.csv")

def test_validate_content_min_cols_fail(validator):
    # Only 1 column (min is 3)
    content = b"col1\nval1"
    with pytest.raises(HTTPException, match="at least 3 columns"):
        validator.validate_file_content(content, "test.csv")

def test_validate_content_empty_cells(validator):
    # 3 cols, 1 row, but empty
    content = b"col1,col2,col3\n,,"
    with pytest.raises(HTTPException, match="appears to be empty"):
        validator.validate_file_content(content, "test.csv")
