export function getGoogleClientId() {
  const raw = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  if (!raw) return '';

  const lowered = raw.toLowerCase();
  if (
    lowered.includes('dummy') ||
    lowered.includes('your-') ||
    lowered.includes('replace') ||
    lowered.includes('example')
  ) {
    return '';
  }

  if (!raw.endsWith('.apps.googleusercontent.com')) {
    return '';
  }

  return raw;
}
