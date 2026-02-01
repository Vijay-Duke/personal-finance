import type { APIRoute } from 'astro';
import { auth } from '@/lib/auth';

/**
 * Catch-all API route for Better Auth.
 * Handles all authentication endpoints:
 * - POST /api/auth/sign-up
 * - POST /api/auth/sign-in
 * - POST /api/auth/sign-out
 * - GET /api/auth/session
 * - POST /api/auth/two-factor/*
 * - POST /api/auth/passkey/*
 * - etc.
 */
export const ALL: APIRoute = async ({ request }) => {
  return auth.handler(request);
};

// Support all HTTP methods
export const GET = ALL;
export const POST = ALL;
export const PUT = ALL;
export const DELETE = ALL;
export const PATCH = ALL;
