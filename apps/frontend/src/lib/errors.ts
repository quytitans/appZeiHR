export function getErrorDetail(err: unknown): string | null {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: unknown }).response === "object"
  ) {
    const response = (err as { response: { data?: { detail?: string } } }).response;
    return response?.data?.detail ?? null;
  }
  return null;
}
