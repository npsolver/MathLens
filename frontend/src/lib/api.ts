const API_BASE = process.env.API_SERVICE_URL ?? "http://localhost:8000";

export type ConvertResponse = {
  latex: string;
};

export async function convertImageToLatex(file: File): Promise<ConvertResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/convert`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
      typeof error.detail === "string"
        ? error.detail
        : "Failed to convert image to LaTeX.";
    throw new Error(message);
  }

  return response.json();
}
