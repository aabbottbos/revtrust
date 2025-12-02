"""
File validation utilities for uploaded files
"""

from fastapi import HTTPException
import pandas as pd
from io import BytesIO


class FileValidator:
    """Validate uploaded files before processing"""

    # File size limits (bytes)
    MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB
    MIN_FILE_SIZE = 100  # 100 bytes

    # Row limits for POC
    MAX_ROWS = 10000

    # Minimum columns required
    MIN_COLUMNS = 3

    @staticmethod
    def validate_file_metadata(filename: str, file_size: int) -> None:
        """
        Validate file metadata before reading content.
        Raises HTTPException on validation failure.
        """
        # Validate filename exists
        if not filename:
            raise HTTPException(400, "No filename provided")

        # Validate file extension
        allowed_extensions = [".csv", ".xlsx", ".xls"]
        if not any(filename.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                400,
                "Invalid file type. Please upload a CSV or Excel file (.csv, .xlsx, .xls)"
            )

        # Validate file size - too small
        if file_size < FileValidator.MIN_FILE_SIZE:
            raise HTTPException(400, "File is empty or corrupted")

        # Validate file size - too large
        if file_size > FileValidator.MAX_FILE_SIZE:
            size_mb = round(file_size / (1024 * 1024), 1)
            raise HTTPException(
                400,
                f"File is too large ({size_mb}MB). Maximum size is 25MB"
            )

        # Check filename length
        if len(filename) > 200:
            raise HTTPException(
                400,
                "Filename is too long. Please rename the file to less than 200 characters"
            )

        # Check for potentially dangerous characters
        if any(char in filename for char in ['<', '>', ':', '"', '|', '?', '*']):
            raise HTTPException(
                400,
                'Filename contains invalid characters. Please remove: < > : " | ? *'
            )

    @staticmethod
    def validate_file_content(contents: bytes, filename: str) -> pd.DataFrame:
        """
        Validate and parse uploaded file content.
        Raises HTTPException with user-friendly messages on validation failure.
        Returns parsed DataFrame on success.
        """
        try:
            # Try to parse based on extension
            if filename.lower().endswith('.csv'):
                df = pd.read_csv(BytesIO(contents))
            elif filename.lower().endswith(('.xlsx', '.xls')):
                df = pd.read_excel(BytesIO(contents))
            else:
                raise HTTPException(
                    400,
                    "Invalid file type. Please upload CSV or Excel file"
                )

        except pd.errors.EmptyDataError:
            raise HTTPException(400, "File is empty or contains no data")
        except pd.errors.ParserError as e:
            raise HTTPException(
                400,
                f"Unable to parse file. Please check the format. Error: {str(e)}"
            )
        except Exception as e:
            error_msg = str(e).lower()
            if "decrypt" in error_msg or "password" in error_msg:
                raise HTTPException(
                    400,
                    "File appears to be password-protected. Please upload an unprotected file"
                )
            raise HTTPException(
                400,
                f"Error reading file: {str(e)}"
            )

        # Validate DataFrame has data
        if df.empty:
            raise HTTPException(
                400,
                "File contains no data rows. Please add at least one row of data"
            )

        # Validate minimum columns
        if len(df.columns) < FileValidator.MIN_COLUMNS:
            raise HTTPException(
                400,
                f"File must have at least {FileValidator.MIN_COLUMNS} columns. "
                f"Found {len(df.columns)} columns. Please check your file format."
            )

        # Validate row count
        if len(df) > FileValidator.MAX_ROWS:
            raise HTTPException(
                400,
                f"File contains too many rows ({len(df):,}). "
                f"Maximum is {FileValidator.MAX_ROWS:,} deals for this POC. "
                "Please split your file or filter to fewer deals."
            )

        # Check if file has at least one row with some data
        non_null_counts = df.notnull().sum().sum()
        if non_null_counts == 0:
            raise HTTPException(
                400,
                "File appears to be empty - all cells are blank. Please add data"
            )

        return df


def get_file_validator() -> FileValidator:
    """Get file validator instance"""
    return FileValidator()
