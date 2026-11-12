export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

type Options = { method?: string; json?: unknown; form?: FormData };

/** Calls the app's own API and throws ApiError with the server's message on failure. */
export async function api<T>(path: string, { method = "GET", json, form }: Options = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: json !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: json !== undefined ? JSON.stringify(json) : form,
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection.", 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? "Something went wrong", res.status, data?.fields);
  return data as T;
}
