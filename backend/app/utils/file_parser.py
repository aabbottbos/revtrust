"""
File parser for CSV and Excel files
Handles various encodings and formats
"""
import pandas as pd
import io
from typing import List, Dict, Any, Tuple
from pathlib import Path


class FileParser:
    """Parse CSV and Excel files into structured data"""

    SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls']
    MAX_PREVIEW_ROWS = 5

    def __init__(self):
        pass

    def parse_file(self, file_content: bytes, filename: str) -> Tuple[List[Dict[str, Any]], List[str], Dict[str, Any]]:
        """
        Parse uploaded file into structured data

        Args:
            file_content: Raw file bytes
            filename: Original filename

        Returns:
            Tuple of (data, headers, metadata)
            - data: List of dicts, each representing a row
            - headers: List of column names
            - metadata: Dict with file info (rows, cols, preview)

        Raises:
            ValueError: If file format is unsupported or parsing fails
        """
        file_ext = Path(filename).suffix.lower()

        if file_ext not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Unsupported file type: {file_ext}. "
                f"Supported types: {', '.join(self.SUPPORTED_EXTENSIONS)}"
            )

        try:
            # Parse based on file type
            if file_ext == '.csv':
                df = self._parse_csv(file_content)
            else:  # .xlsx or .xls
                df = self._parse_excel(file_content)

            # Validate dataframe
            if df.empty:
                raise ValueError("File is empty or contains no valid data")

            # Clean column names
            df.columns = self._clean_column_names(df.columns)

            # Convert to list of dicts
            data = df.to_dict('records')

            # Get headers
            headers = df.columns.tolist()

            # Generate metadata
            metadata = self._generate_metadata(df, filename)

            return data, headers, metadata

        except Exception as e:
            raise ValueError(f"Failed to parse file: {str(e)}")

    def _parse_csv(self, file_content: bytes) -> pd.DataFrame:
        """Parse CSV file with various encoding attempts"""
        encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']

        for encoding in encodings:
            try:
                return pd.read_csv(
                    io.BytesIO(file_content),
                    encoding=encoding,
                    skipinitialspace=True,
                    skip_blank_lines=True,
                )
            except UnicodeDecodeError:
                continue
            except Exception as e:
                if encoding == encodings[-1]:
                    raise e
                continue

        raise ValueError("Unable to decode CSV file with supported encodings")

    def _parse_excel(self, file_content: bytes) -> pd.DataFrame:
        """Parse Excel file"""
        try:
            # Read first sheet
            df = pd.read_excel(
                io.BytesIO(file_content),
                sheet_name=0,
                engine='openpyxl'
            )
            return df
        except Exception as e:
            raise ValueError(f"Failed to parse Excel file: {str(e)}")

    def _clean_column_names(self, columns: pd.Index) -> List[str]:
        """Clean and standardize column names"""
        cleaned = []
        seen = set()

        for col in columns:
            # Convert to string and strip whitespace
            col_str = str(col).strip()

            # Handle unnamed columns
            if col_str.lower().startswith('unnamed'):
                col_str = f"column_{len(cleaned) + 1}"

            # Ensure uniqueness
            original = col_str
            counter = 1
            while col_str in seen:
                col_str = f"{original}_{counter}"
                counter += 1

            seen.add(col_str)
            cleaned.append(col_str)

        return cleaned

    def _generate_metadata(self, df: pd.DataFrame, filename: str) -> Dict[str, Any]:
        """Generate metadata about the parsed file"""
        # Get preview rows
        preview_df = df.head(self.MAX_PREVIEW_ROWS)
        preview = preview_df.to_dict('records')

        # Get data types
        dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}

        # Calculate statistics
        null_counts = df.isnull().sum().to_dict()
        null_percentages = {
            col: round((count / len(df)) * 100, 2)
            for col, count in null_counts.items()
        }

        return {
            'filename': filename,
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'columns': df.columns.tolist(),
            'preview': preview,
            'data_types': dtypes,
            'null_counts': null_counts,
            'null_percentages': null_percentages,
        }

    def validate_required_fields(
        self,
        headers: List[str],
        required_fields: List[str]
    ) -> Tuple[bool, List[str]]:
        """
        Check if required fields can be mapped from headers

        Args:
            headers: List of column names from file
            required_fields: List of required field names

        Returns:
            Tuple of (all_found, missing_fields)
        """
        headers_lower = [h.lower().strip() for h in headers]
        missing = []

        for field in required_fields:
            field_lower = field.lower().strip()
            # Simple check - actual mapping will be smarter
            found = any(field_lower in h for h in headers_lower)
            if not found:
                missing.append(field)

        return len(missing) == 0, missing


class DataCleaner:
    """Clean and normalize parsed data"""

    @staticmethod
    def clean_row(row: Dict[str, Any]) -> Dict[str, Any]:
        """Clean a single row of data"""
        cleaned = {}

        for key, value in row.items():
            # Handle pandas NA/NaN
            if pd.isna(value):
                cleaned[key] = None
            # Convert to string and strip if needed
            elif isinstance(value, str):
                cleaned[key] = value.strip() if value.strip() else None
            else:
                cleaned[key] = value

        return cleaned

    @staticmethod
    def clean_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Clean all rows in dataset"""
        return [DataCleaner.clean_row(row) for row in data]

    @staticmethod
    def remove_empty_rows(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove rows that are completely empty"""
        return [
            row for row in data
            if any(v is not None and v != '' for v in row.values())
        ]
