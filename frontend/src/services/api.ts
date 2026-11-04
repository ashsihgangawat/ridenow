/**
 * RideNow Centralized API Client & URL Resolver
 */

export const getApiBaseUrl = (): string => {
  // 1. Explicit Vite environment variable (if set in Amplify or .env)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Production check (e.g. AWS Amplify *.amplifyapp.com or any non-localhost host)
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://ridenow-bx6n.onrender.com';
  }

  // 3. Local development fallback (proxied by Vite or direct to Render if no local backend)
  return '';
};

export const apiUrl = (path: string): string => {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
};

/**
 * Robust JSON Fetcher
 * Safely parses responses, extracts error messages, and avoids SyntaxError on HTML errors (e.g. 404, 502, SPA fallbacks).
 */
export async function fetchJson<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const targetUrl = apiUrl(path);
  const headers = new Headers(options?.headers || {});

  if (!headers.has('Content-Type') && options?.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(targetUrl, { ...options, headers });
  } catch (networkErr: any) {
    throw new Error(
      `Network connection failed to ${targetUrl}. Please check your internet connection or server status.`
    );
  }

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      const errorMsg =
        data.message || data.detail || `Server returned error (${res.status})`;
      throw new Error(errorMsg);
    }
    return data as T;
  }

  // Non-JSON response (e.g., HTML from 404, 502 Bad Gateway from Render cold start, or SPA fallback)
  const text = await res.text();
  if (text.includes('<!doctype') || text.includes('<html')) {
    if (res.status === 404) {
      throw new Error(
        `API endpoint not found (404) at ${targetUrl}. Please check server routes.`
      );
    }
    if (res.status === 502 || res.status === 503) {
      throw new Error(
        'The Render backend service is currently waking up from sleep. Please wait 15-20 seconds and try again.'
      );
    }
    throw new Error(
      `Unexpected HTML response from server (Status ${res.status}). Expected JSON.`
    );
  }

  if (!res.ok) {
    throw new Error(`Server returned error ${res.status}: ${text.slice(0, 120)}`);
  }

  throw new Error('Server returned an unexpected non-JSON response.');
}

