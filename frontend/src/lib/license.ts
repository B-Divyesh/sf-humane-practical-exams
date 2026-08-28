import { writable } from 'svelte/store';

const slug = 'humane-practical-exams';
const tokenKey = `sb_license:${slug}`;
const verdictKey = `${tokenKey}:verdict`;
export const checkoutUrl = `https://api.sociobot.in/api/v1/products/${slug}/checkout`;
export const license = writable({ unlocked: false, checking: false, notice: '' });

export function captureLicense() {
  const url = new URL(window.location.href);
  const incoming = url.searchParams.get('license');
  if (incoming) {
    localStorage.setItem(tokenKey, incoming);
    url.searchParams.delete('license');
    history.replaceState({}, '', url);
  }
  void verifyLicense(Boolean(incoming));
}

export async function verifyLicense(force = false) {
  const token = localStorage.getItem(tokenKey);
  if (!token) return license.set({ unlocked: false, checking: false, notice: '' });
  const cached = JSON.parse(localStorage.getItem(verdictKey) || 'null') as { valid: boolean; checked: number } | null;
  const fresh = cached && Date.now() - cached.checked < 86_400_000;
  if (fresh && !force) license.set({ unlocked: cached.valid, checking: false, notice: cached.valid ? '' : 'License no longer active.' });
  else license.set({ unlocked: cached?.valid ?? true, checking: true, notice: '' });
  try {
    const response = await fetch(`https://api.sociobot.in/api/v1/products/${slug}/verify?license=${encodeURIComponent(token)}`);
    const result = await response.json() as { valid: boolean };
    localStorage.setItem(verdictKey, JSON.stringify({ valid: result.valid, checked: Date.now() }));
    license.set({ unlocked: result.valid, checking: false, notice: result.valid ? '' : 'License no longer active.' });
  } catch {
    license.update((value) => ({ ...value, checking: false, notice: value.unlocked ? 'License check will retry when you are online.' : 'Could not verify the license while offline.' }));
  }
}

export function restoreLicense(token: string) {
  localStorage.setItem(tokenKey, token.trim());
  localStorage.removeItem(verdictKey);
  return verifyLicense(true);
}
