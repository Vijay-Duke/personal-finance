/**
 * Invite code generation utilities.
 * Uses an unambiguous character set for easy sharing.
 */

// Excludes 0/O, 1/I/l to avoid visual ambiguity
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

/**
 * Generate a random invite code.
 * 8 chars from a 32-char alphabet = ~40 bits of entropy.
 * Uses rejection sampling to avoid modulo bias.
 */
export function generateInviteCode(): string {
  const result: string[] = [];
  const maxValid = 256 - (256 % CHARSET.length); // 256 - (256 % 32) = 256
  while (result.length < CODE_LENGTH) {
    const bytes = new Uint8Array(CODE_LENGTH);
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b < maxValid && result.length < CODE_LENGTH) {
        result.push(CHARSET[b % CHARSET.length]);
      }
    }
  }
  return result.join('');
}
