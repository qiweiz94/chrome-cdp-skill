import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatHostForWebSocket,
  isLoopbackHost,
  validateCdpHost,
  validateNavUrl,
  validateOpenUrl,
} from './security.mjs';

test('validateNavUrl accepts http and https', () => {
  assert.equal(validateNavUrl('http://example.com/path'), 'http://example.com/path');
  assert.equal(validateNavUrl('https://example.com/path?q=1'), 'https://example.com/path?q=1');
});

test('validateNavUrl rejects non-http schemes', () => {
  assert.throws(() => validateNavUrl('file:///tmp/test.txt'), /Only http\/https URLs are allowed/);
  assert.throws(() => validateNavUrl('javascript:alert(1)'), /Only http\/https URLs are allowed/);
});

test('validateOpenUrl allows implicit about blank only when url is omitted', () => {
  assert.equal(validateOpenUrl(), 'about:blank');
  assert.equal(validateOpenUrl('https://example.com'), 'https://example.com/');
});

test('validateOpenUrl rejects unsafe schemes', () => {
  assert.throws(() => validateOpenUrl('file:///tmp/test.txt'), /Only http\/https URLs are allowed/);
  assert.throws(() => validateOpenUrl('data:text/html,hi'), /Only http\/https URLs are allowed/);
  assert.throws(() => validateOpenUrl('javascript:alert(1)'), /Only http\/https URLs are allowed/);
});

test('loopback host detection accepts local hosts', () => {
  assert.equal(isLoopbackHost('127.0.0.1'), true);
  assert.equal(isLoopbackHost('127.1.2.3'), true);
  assert.equal(isLoopbackHost('localhost'), true);
  assert.equal(isLoopbackHost('::1'), true);
});

test('validateCdpHost rejects remote hosts unless explicitly allowed', () => {
  assert.equal(validateCdpHost('127.0.0.1'), '127.0.0.1');
  assert.throws(() => validateCdpHost('192.168.1.10'), /Refusing non-loopback CDP_HOST/);
  assert.equal(validateCdpHost('192.168.1.10', true), '192.168.1.10');
});

test('formatHostForWebSocket brackets ipv6 addresses', () => {
  assert.equal(formatHostForWebSocket('::1'), '[::1]');
  assert.equal(formatHostForWebSocket('127.0.0.1'), '127.0.0.1');
});
