export interface ValidationResult {
  valid: boolean
  error?: string
}

export class UploadValidator {
  // File size limits
  static readonly MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
  static readonly MIN_FILE_SIZE = 100 // 100 bytes

  // Allowed formats
  static readonly ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"]
  static readonly ALLOWED_MIME_TYPES = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]

  static validateFile(file: File): ValidationResult {
    // Check file exists
    if (!file) {
      return {
        valid: false,
        error: "No file selected",
      }
    }

    // Check file size - too small
    if (file.size < this.MIN_FILE_SIZE) {
      return {
        valid: false,
        error: "File is empty or corrupted",
      }
    }

    // Check file size - too large
    if (file.size > this.MAX_FILE_SIZE) {
      const sizeMB = Math.round(file.size / (1024 * 1024))
      return {
        valid: false,
        error: `File is too large (${sizeMB}MB). Maximum size is 25MB.`,
      }
    }

    // Check file extension
    const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
    if (!extension || !this.ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `Invalid file type. Please upload a CSV or Excel file (.csv, .xlsx, .xls)`,
      }
    }

    // Check MIME type if available
    if (file.type && !this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: "File type not recognized. Please upload a valid CSV or Excel file.",
      }
    }

    // Check filename length
    if (file.name.length > 200) {
      return {
        valid: false,
        error: "Filename is too long. Please rename the file.",
      }
    }

    // Check for special characters that might cause issues
    if (/[<>:"|?*]/.test(file.name)) {
      return {
        valid: false,
        error: 'Filename contains invalid characters. Please remove: < > : " | ? *',
      }
    }

    return { valid: true }
  }

  static async validateFileContent(file: File): Promise<ValidationResult> {
    try {
      // Read first few bytes to verify it's not corrupted
      const chunk = file.slice(0, 1000)
      const text = await chunk.text()

      // For CSV, check if it has some basic structure
      if (file.name.endsWith(".csv")) {
        const lines = text.split("\n").filter((l) => l.trim())

        if (lines.length === 0) {
          return {
            valid: false,
            error: "CSV file appears to be empty",
          }
        }

        // Check for at least 2 lines (header + 1 data row minimum)
        if (lines.length < 2) {
          return {
            valid: false,
            error: "CSV file must contain at least a header row and one data row",
          }
        }

        // Check if first line has some columns
        const headerCols = lines[0].split(",").filter((c) => c.trim())
        if (headerCols.length < 3) {
          return {
            valid: false,
            error: "CSV must have at least 3 columns. Please check your file format.",
          }
        }
      }

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: "Unable to read file. File may be corrupted.",
      }
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }
}
