import type { ApiErrorBody } from "@/lib/types";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const NETWORK_ERROR =
  "No se pudo enviar. Revisa tu conexión e intenta de nuevo.";

function isNetworkFailure(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("load failed") ||
    message.includes("networkerror") ||
    message.includes("network connection was lost")
  );
}

async function readJson<T>(response: Response): Promise<T | ApiErrorBody> {
  const text = await response.text();
  if (text.length === 0) {
    throw new ApiRequestError(NETWORK_ERROR, response.status || 502, "NETWORK");
  }
  try {
    return JSON.parse(text) as T | ApiErrorBody;
  } catch {
    throw new ApiRequestError(NETWORK_ERROR, response.status || 502, "NETWORK");
  }
}

function throwIfApiError<T>(response: Response, json: T | ApiErrorBody): T {
  if (!response.ok) {
    const body = json as ApiErrorBody;
    throw new ApiRequestError(body.error ?? "Error de red", response.status, body.code);
  }
  return json as T;
}

export async function apiRequest<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    return throwIfApiError(response, await readJson<T>(response));
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    if (isNetworkFailure(error)) {
      throw new ApiRequestError(NETWORK_ERROR, 503, "NETWORK");
    }
    throw error;
  }
}

export async function apiFormRequest<T>(url: string, form: FormData): Promise<T> {
  try {
    const response = await fetch(url, { method: "POST", body: form });
    return throwIfApiError(response, await readJson<T>(response));
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    if (isNetworkFailure(error)) {
      throw new ApiRequestError(NETWORK_ERROR, 503, "NETWORK");
    }
    throw error;
  }
}
