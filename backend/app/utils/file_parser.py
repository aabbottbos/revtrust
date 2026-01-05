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
        """Parse Excel file, detecting header row if needed"""
        try:
            # First, try to detect the header row
            # Some exports (like Salesforce) have metadata rows before the actual headers
            df_raw = pd.read_excel(
                io.BytesIO(file_content),
                sheet_name=0,
                engine='openpyxl',
                header=None  # Don't assume any header yet
            )

            # Find the header row by looking for a row with mostly non-null string values
            # that look like column headers (not dates, numbers, or "Unnamed")
            header_row = self._detect_header_row(df_raw)

            print(f"📊 Excel Header Detection:")
            print(f"  - Detected header row: {header_row}")
            if header_row > 0:
                print(f"  - Row contents: {df_raw.iloc[header_row].tolist()[:5]}...")

            if header_row > 0:
                # Re-read with correct header row
                df = pd.read_excel(
                    io.BytesIO(file_content),
                    sheet_name=0,
                    engine='openpyxl',
                    header=header_row
                )
                print(f"  - Final columns: {df.columns.tolist()[:5]}...")
            else:
                # Standard read - first row is header
                df = pd.read_excel(
                    io.BytesIO(file_content),
                    sheet_name=0,
                    engine='openpyxl'
                )
                print(f"  - Final columns (from row 0): {df.columns.tolist()[:5]}...")

            return df
        except Exception as e:
            raise ValueError(f"Failed to parse Excel file: {str(e)}")

    def _detect_header_row(self, df: pd.DataFrame) -> int:
        """
        Detect which row contains the actual column headers.
        Looks for a row with multiple non-null text values that look like headers.
        """
        # Common header keywords to look for
        header_keywords = [
            'name', 'id', 'date', 'amount', 'stage', 'owner', 'account',
            'opportunity', 'deal', 'probability', 'close', 'type', 'source',
            'created', 'status', 'revenue', 'company', 'contact'
        ]

        for idx in range(min(20, len(df))):  # Check first 20 rows
            row = df.iloc[idx]
            non_null_values = [v for v in row if pd.notna(v)]

            # Skip rows with too few values
            if len(non_null_values) < 3:
                continue

            # Convert to strings safely and check if they look like headers
            str_values = []
            for v in non_null_values:
                try:
                    str_val = str(v).lower().strip()
                    str_values.append(str_val)
                except (AttributeError, TypeError):
                    # Skip values that can't be converted to string
                    str_values.append('')

            # Count how many values contain header keywords
            keyword_matches = sum(
                1 for val in str_values
                if val and any(kw in val for kw in header_keywords)
            )

            # Also check if most values are short strings (likely headers)
            short_strings = sum(
                1 for val in str_values
                if val and len(val) < 50 and not val.replace('.', '').replace('-', '').isdigit()
            )

            # If we have multiple keyword matches and mostly short strings, this is likely the header
            if keyword_matches >= 3 or (short_strings >= len(str_values) * 0.7 and len(non_null_values) >= 5):
                return idx

        return 0  # Default to first row

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
