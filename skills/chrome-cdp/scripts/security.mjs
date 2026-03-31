import net from 'net';

const ALLOWED_WEB_PROTOCOLS = new Set(['http:', 'https:']);
const LOOPBACK_HOSTNAMES = new Set(['localhost']);

function isLoopbackIp(host) {
  const ipVersion = net.isIP(host);
  if (ipVersion === 4) return host.startsWith('127.');
  if (ipVersion === 6) return host === '::1';
  return false;
}

export function isLoopbackHost(host) {
  if (!host) return true;
  const normalized = host.trim().toLowerCase();
  if (!normalized) return true;
  if (LOOPBACK_HOSTNAMES.has(normalized)) return true;
  return isLoopbackIp(normalized);
}

export function formatHostForWebSocket(host) {
  if (net.isIP(host) === 6) return `[${host}]`;
  return host;
}

export function validateCdpHost(host, allowRemote = false) {
  const normalized = (host || '127.0.0.1').trim();
  if (!normalized) return '127.0.0.1';
  if (!allowRemote && !isLoopbackHost(normalized)) {
    throw new Error(
      `Refusing non-loopback CDP_HOST "${normalized}". Set CDP_ALLOW_REMOTE_HOST=1 to allow remote DevTools endpoints.`
    );
  }
  return normalized;
}

function validateHttpUrl(url, context) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL for ${context}: ${url}`);
  }
  if (!ALLOWED_WEB_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`Only http/https URLs are allowed for ${context}, got: ${url}`);
  }
  return parsed.toString();
}

export function validateNavUrl(url) {
  return validateHttpUrl(url, 'navigation');
}

export function validateOpenUrl(url) {
  if (!url) return 'about:blank';
  return validateHttpUrl(url, 'open');
}
