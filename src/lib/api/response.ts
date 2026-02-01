/**
 * Standard API response helpers for consistent JSON responses.
 */

export function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function unauthorized(message = 'Unauthorized'): Response {
  return error(message, 401);
}

export function forbidden(message = 'Forbidden'): Response {
  return error(message, 403);
}

export function notFound(message = 'Not found'): Response {
  return error(message, 404);
}

export function created<T>(data: T): Response {
  return json(data, 201);
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function validationError(errors: Record<string, string>): Response {
  return json({ error: 'Validation failed', details: errors }, 422);
}
