const REQUEST_ID_HEADER = "x-request-id";
const TRACEPARENT_HEADER = "traceparent";
const REQUEST_ID_MIN_LENGTH = 8;
const REQUEST_ID_MAX_LENGTH = 128;
const SAFE_REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]+$/;
const TRACEPARENT_PATTERN =
  /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

function randomBytes(size: number) {
  const bytes = new Uint8Array(size);
  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
    return bytes;
  }

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }

  return bytes;
}

function randomHex(size: number) {
  return Array.from(randomBytes(size), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function nonZeroRandomHex(size: number) {
  let value = randomHex(size);

  while (/^0+$/.test(value)) {
    value = randomHex(size);
  }

  return value;
}

export function safeRequestId(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (
    trimmed.length === 0 ||
    trimmed.length < REQUEST_ID_MIN_LENGTH ||
    trimmed.length > REQUEST_ID_MAX_LENGTH ||
    !SAFE_REQUEST_ID_PATTERN.test(trimmed)
  ) {
    return null;
  }

  return trimmed;
}

export function createRequestId(): string {
  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  return `req_${randomHex(16)}`;
}

export function safeTraceparent(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  const match = TRACEPARENT_PATTERN.exec(trimmed);

  if (!match) {
    return null;
  }

  const [, traceId, parentId] = match;

  if (!traceId || !parentId || /^0+$/.test(traceId) || /^0+$/.test(parentId)) {
    return null;
  }

  return trimmed;
}

export function createTraceparent(): string {
  return `00-${nonZeroRandomHex(16)}-${nonZeroRandomHex(8)}-01`;
}

export function withObservabilityHeaders(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers);
  const requestId = safeRequestId(nextHeaders.get(REQUEST_ID_HEADER)) ?? createRequestId();
  const traceparent = safeTraceparent(nextHeaders.get(TRACEPARENT_HEADER)) ?? createTraceparent();

  nextHeaders.set(REQUEST_ID_HEADER, requestId);
  nextHeaders.set(TRACEPARENT_HEADER, traceparent);

  return nextHeaders;
}
