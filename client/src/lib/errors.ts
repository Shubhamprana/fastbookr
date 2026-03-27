type ZodIssueLike = {
  path?: Array<string | number>;
  message?: string;
};

function isZodIssueArray(value: unknown): value is ZodIssueLike[] {
  return (
    Array.isArray(value) &&
    value.every(
      item =>
        typeof item === "object" &&
        item !== null &&
        ("message" in item || "path" in item)
    )
  );
}

export function formatAppErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    const rawMessage = (error as { message: string }).message;

    try {
      const parsed = JSON.parse(rawMessage);
      if (isZodIssueArray(parsed) && parsed.length > 0) {
        const firstIssue = parsed[0];
        const pathLabel =
          firstIssue.path && firstIssue.path.length > 0
            ? String(firstIssue.path[0])
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, char => char.toUpperCase())
            : "Field";

        if (firstIssue.message) {
          return `${pathLabel}: ${firstIssue.message}`;
        }
      }
    } catch {
      return rawMessage;
    }

    return rawMessage;
  }

  return fallback;
}
