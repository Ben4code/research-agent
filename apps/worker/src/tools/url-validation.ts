import { promises as dns } from 'node:dns';
import { hostname } from 'node:os';

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  hostname().toLowerCase(),
]);

const PRIVATE_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    const host = parsed.hostname.toLowerCase();

    if (BLOCKED_HOSTS.has(host)) return false;
    if (PRIVATE_RANGES.some((re) => re.test(host))) return false;
    if (host.endsWith('.local') || host.endsWith('.internal')) return false;

    return true;
  } catch {
    return false;
  }
}

export async function assertSafeUrl(url: string): Promise<void> {
  if (!isValidUrl(url)) {
    throw new Error(`URL failed validation: ${url}`);
  }

  const parsed = new URL(url);
  try {
    const records = await dns.resolve4(parsed.hostname);
    for (const ip of records) {
      if (
        ip === '127.0.0.1' ||
        ip === '0.0.0.0' ||
        PRIVATE_RANGES.some((re) => re.test(ip))
      ) {
        throw new Error(`URL resolves to private IP: ${url} -> ${ip}`);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('private IP')) {
      throw error;
    }
  }
}
