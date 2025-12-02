const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function healthCheck() {
  const response = await fetch(`${API_URL}/api/health`)
  return response.json()
}

export async function analyzeCSV(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Analysis failed")
  }

  return response.json()
}
