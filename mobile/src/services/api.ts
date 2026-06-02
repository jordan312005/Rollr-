// Thin fetch wrapper that attaches the current auth token to every request.
import { ENV } from '../config/env';

export type ApiClient = {
  get: <T = any>(path: string) => Promise<T>;
  post: <T = any>(path: string, body?: unknown) => Promise<T>;
};

/**
 * @param getToken returns the current bearer token (Supabase access token for
 *   customer/mechanic, or the backend admin JWT), or null if unauthenticated.
 */
export function createApiClient(getToken: () => Promise<string | null>): ApiClient {
  async function request<T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
    const token = await getToken();
    let res: Response;
    try {
      res = await fetch(ENV.apiUrl + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e: any) {
      throw new Error(
        `Cannot reach the Rollr API at ${ENV.apiUrl}. Is the backend running? (${e.message})`
      );
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }
    return data as T;
  }

  return {
    get: (path) => request(path, 'GET'),
    post: (path, body) => request(path, 'POST', body),
  };
}
