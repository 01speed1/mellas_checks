type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiClientOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  timeoutMillis?: number;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

interface ApiErrorShape {
  message: string;
  status: number;
  details?: unknown;
}

const DEFAULT_TIMEOUT = 10000;

function buildQuery(query?: Record<string, string | number | boolean | undefined>) {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined) return;
    params.append(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function resolveBaseUrl() {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) throw new Error('Missing VITE_API_BASE_URL');
  return base.replace(/\/$/, '');
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
}

export async function apiRequest<T>(
  path: string,
  method: HttpMethod = 'GET',
  options: ApiClientOptions = {}
): Promise<T> {
  const { signal, headers, timeoutMillis, query, body } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMillis ?? DEFAULT_TIMEOUT);
  const mergedSignal = mergeAbortSignals(signal, controller.signal);
  try {
    const baseUrl = resolveBaseUrl();
    const queryString = buildQuery(query);
    const finalUrl = `${baseUrl}${path}${queryString}`;
    const init: RequestInit = {
      method,
      headers: {
        'Content-Type': body ? 'application/json' : 'text/plain',
        ...headers,
      },
      signal: mergedSignal,
      body: body ? JSON.stringify(body) : undefined,
    };
    const response = await fetch(finalUrl, init);
    const payload = await parseResponse(response);
    if (!response.ok) {
      const message = typeof payload === 'string' ? payload : payload?.message || 'Request failed';
      throw new ApiError(
        message,
        response.status,
        typeof payload === 'string' ? undefined : payload
      );
    }
    return payload as T;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new ApiError('Request timeout', 499);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function mergeAbortSignals(external?: AbortSignal, internal?: AbortSignal) {
  if (!external) return internal;
  if (!internal) return external;
  const controller = new AbortController();
  const forwardAbort = (signal: AbortSignal) => {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  };
  forwardAbort(external);
  forwardAbort(internal);
  return controller.signal;
}
