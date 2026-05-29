// Phone-number format validation shared across setup wizard and edit info screen.
// Accepts common international/local formats: optional leading +, digits, spaces,
// hyphens, parentheses. Requires 7-15 actual digits (E.164 max is 15).
export function isValidPhone(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  // Allowed characters check
  if (!/^[+]?[\d\s()-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function phoneError(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'Phone number is required.';
  if (!/^[+]?[\d\s()-]+$/.test(trimmed)) return 'Phone may only contain digits, spaces, + ( ) and -.';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7) return 'Phone number is too short.';
  if (digits.length > 15) return 'Phone number is too long.';
  return '';
}
