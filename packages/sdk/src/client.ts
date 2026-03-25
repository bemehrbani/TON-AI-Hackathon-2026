/**
 * Lightweight HTTP client for the ONTON Reputation API.
 * Zero dependencies — uses native fetch.
 */
export class OntonClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    // Remove trailing slash
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new OntonAPIError(response.status, (error as { error?: string }).error ?? "Unknown error", path);
    }

    return response.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new OntonAPIError(response.status, (error as { error?: string }).error ?? "Unknown error", path);
    }

    return response.json() as Promise<T>;
  }
}

export class OntonAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly path: string
  ) {
    super(`ONTON API Error [${status}] ${path}: ${detail}`);
    this.name = "OntonAPIError";
  }
}
