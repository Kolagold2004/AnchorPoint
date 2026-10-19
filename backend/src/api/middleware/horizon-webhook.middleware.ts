import { createHmac, timingSafeEqual } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { config } from '../../config/env';
import logger from '../../utils/logger';

export interface HorizonWebhookSignatureOptions {
  /**
   * Shared secret for HMAC-SHA256 verification.
   * Defaults to `process.env.HORIZON_WEBHOOK_SECRET` or `config.HORIZON_WEBHOOK_SECRET`.
   */
  secret?: string;

  /**
   * Maximum allowed age (in seconds) between the signature timestamp and
   * the current wall-clock time. Defaults to 300 seconds (5 minutes).
   */
  maxAgeSeconds?: number;

  /**
   * Header carrying the signature. Defaults to `x-stellar-signature`.
   */
  signatureHeader?: string;

  /**
   * Fallback header carrying the timestamp when not embedded in the signature header.
   * Defaults to `x-stellar-timestamp`.
   */
  timestampHeader?: string;
}

export const DEFAULT_HORIZON_MAX_AGE_SECONDS = 300;
export const DEFAULT_STELLAR_SIGNATURE_HEADER = 'x-stellar-signature';
export const DEFAULT_STELLAR_TIMESTAMP_HEADER = 'x-stellar-timestamp';

export interface ParsedStellarSignature {
  signature: string;
  timestamp?: string;
}

/**
 * Computes an HMAC-SHA256 hex digest over `${timestamp}.${rawBody}` (or `rawBody` when timestamp is omitted).
 */
export function computeHorizonSignature(
  rawBody: string,
  secret: string,
  timestamp?: string | number,
): string {
  const payload =
    timestamp !== undefined && timestamp !== ''
      ? `${timestamp}.${rawBody}`
      : rawBody;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Formats an `X-Stellar-Signature` header value (`t=<timestamp>,v1=<hex>`).
 */
export function formatStellarSignatureHeader(
  rawBody: string,
  secret: string,
  timestamp: string | number = Math.floor(Date.now() / 1000),
): string {
  const digest = computeHorizonSignature(rawBody, secret, timestamp);
  return `t=${timestamp},v1=${digest}`;
}

/**
 * Parses `X-Stellar-Signature` header values.
 *
 * Supported formats:
 *  - `t=<unix_ts>,v1=<hex>` or `t=<unix_ts>,sha256=<hex>` or `t=<unix_ts>,s=<hex>`
 *  - `<unix_ts>.<hex>` or `<unix_ts>.sha256=<hex>`
 *  - `sha256=<hex>` or `<hex>` (timestamp read from `X-Stellar-Timestamp` / `X-Webhook-Timestamp` or payload)
 */
export function parseStellarSignatureHeader(
  headerValue: string,
): ParsedStellarSignature | null {
  const trimmed = headerValue.trim();
  if (!trimmed) {
    return null;
  }

  // Format 1: key=value pairs separated by commas (e.g. "t=1700000000,v1=abcdef...")
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim());
    let timestamp: string | undefined;
    let signature: string | undefined;

    for (const part of parts) {
      const eqIdx = part.indexOf('=');
      if (eqIdx === -1) continue;
      const key = part.slice(0, eqIdx).trim().toLowerCase();
      const val = part.slice(eqIdx + 1).trim();
      if (key === 't' || key === 'ts' || key === 'timestamp') {
        timestamp = val;
      } else if (key === 'v1' || key === 'sha256' || key === 's' || key === 'sig' || key === 'signature') {
        signature = val.replace(/^sha256=/i, '');
      }
    }

    if (signature) {
      return { signature, timestamp };
    }
  }

  // Format 2: "<timestamp>.<signature>"
  const dotIdx = trimmed.indexOf('.');
  if (dotIdx > 0) {
    const maybeTs = trimmed.slice(0, dotIdx).trim();
    const rest = trimmed.slice(dotIdx + 1).trim();
    if (/^\d+$/.test(maybeTs) && rest.length > 0) {
      return {
        timestamp: maybeTs,
        signature: rest.replace(/^sha256=/i, ''),
      };
    }
  }

  // Format 3: "sha256=<hex>" or raw "<hex>" / base64
  const cleaned = trimmed.replace(/^sha256=/i, '').trim();
  if (!cleaned) {
    return null;
  }

  return { signature: cleaned };
}

/**
 * Constant-time comparison between two digests.
 */
function safeCompare(expectedHex: string, provided: string): boolean {
  try {
    const normalizedProvided = provided.replace(/^sha256=/i, '').trim();
    const a = Buffer.from(expectedHex, 'utf8');
    const b = Buffer.from(normalizedProvided, 'utf8');
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Normalizes a Unix timestamp (seconds, milliseconds, or ISO-8601) to Unix seconds.
 */
function parseTimestampToSeconds(rawTimestamp: string | number): number | null {
  if (typeof rawTimestamp === 'number') {
    if (!Number.isFinite(rawTimestamp)) return null;
    return rawTimestamp > 1e12 ? Math.floor(rawTimestamp / 1000) : Math.floor(rawTimestamp);
  }

  const trimmed = rawTimestamp.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    if (!Number.isFinite(num)) return null;
    return num > 1e12 ? Math.floor(num / 1000) : num;
  }

  const parsedMs = Date.parse(trimmed);
  if (!Number.isNaN(parsedMs)) {
    return Math.floor(parsedMs / 1000);
  }

  return null;
}

/**
 * Extracts raw request body as a string for HMAC computation.
 */
function extractRawBody(req: Request): string {
  const reqWithRaw = req as Request & { rawBody?: string | Buffer };
  if (typeof reqWithRaw.rawBody === 'string') {
    return reqWithRaw.rawBody;
  }
  if (Buffer.isBuffer(reqWithRaw.rawBody)) {
    return reqWithRaw.rawBody.toString('utf8');
  }
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }
  if (typeof req.body === 'string') {
    return req.body;
  }
  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body);
  }
  return '';
}

/**
 * Factory creating Express middleware that verifies `X-Stellar-Signature`
 * HMAC-SHA256 signatures and enforces a 5-minute replay window.
 */
export function createHorizonWebhookMiddleware(
  options: HorizonWebhookSignatureOptions = {},
) {
  const maxAgeSeconds = options.maxAgeSeconds ?? DEFAULT_HORIZON_MAX_AGE_SECONDS;
  const sigHeader = (options.signatureHeader ?? DEFAULT_STELLAR_SIGNATURE_HEADER).toLowerCase();
  const tsHeader = (options.timestampHeader ?? DEFAULT_STELLAR_TIMESTAMP_HEADER).toLowerCase();

  return function verifyHorizonWebhook(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const secret =
      options.secret ??
      process.env.HORIZON_WEBHOOK_SECRET ??
      config.HORIZON_WEBHOOK_SECRET;

    if (!secret) {
      logger.error('HORIZON_WEBHOOK_SECRET is not configured');
      res.status(401).json({ error: 'webhook_secret_not_configured' });
      return;
    }

    const rawSigHeader = req.headers[sigHeader];
    const headerValue = Array.isArray(rawSigHeader) ? rawSigHeader[0] : rawSigHeader;

    if (!headerValue || typeof headerValue !== 'string') {
      logger.warn('Horizon webhook request missing X-Stellar-Signature header', {
        path: req.path,
      });
      res.status(401).json({ error: 'missing_signature' });
      return;
    }

    const parsed = parseStellarSignatureHeader(headerValue);
    if (!parsed || !parsed.signature) {
      logger.warn('Horizon webhook request has malformed X-Stellar-Signature header', {
        path: req.path,
      });
      res.status(401).json({ error: 'invalid_signature' });
      return;
    }

    // Resolve timestamp from signature header, fallback timestamp headers, or request body
    const fallbackHeaderTs =
      (req.headers[tsHeader] as string | undefined) ??
      (req.headers['x-webhook-timestamp'] as string | undefined);
    const bodyTs =
      req.body && typeof req.body === 'object'
        ? (req.body as Record<string, unknown>).timestamp
        : undefined;

    const rawTimestamp =
      parsed.timestamp ??
      fallbackHeaderTs ??
      (typeof bodyTs === 'string' || typeof bodyTs === 'number' ? String(bodyTs) : undefined);

    if (rawTimestamp === undefined || rawTimestamp === '') {
      logger.warn('Horizon webhook request missing timestamp', { path: req.path });
      res.status(401).json({ error: 'missing_timestamp' });
      return;
    }

    const timestampSeconds = parseTimestampToSeconds(rawTimestamp);
    if (timestampSeconds === null) {
      logger.warn('Horizon webhook request has invalid timestamp', {
        rawTimestamp,
        path: req.path,
      });
      res.status(401).json({ error: 'invalid_timestamp' });
      return;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - timestampSeconds) > maxAgeSeconds) {
      logger.warn('Horizon webhook request timestamp outside acceptable replay window', {
        timestampSeconds,
        nowSeconds,
        maxAgeSeconds,
        path: req.path,
      });
      res.status(401).json({ error: 'timestamp_too_old' });
      return;
    }

    const rawBody = extractRawBody(req);

    // Check HMAC over `${rawTimestamp}.${rawBody}` as well as raw `rawBody` (when timestamp came from header/body)
    const expectedWithTimestamp = computeHorizonSignature(rawBody, secret, String(rawTimestamp));
    const expectedRawOnly = computeHorizonSignature(rawBody, secret);

    const isValid =
      safeCompare(expectedWithTimestamp, parsed.signature) ||
      safeCompare(expectedRawOnly, parsed.signature);

    if (!isValid) {
      logger.warn('Horizon webhook HMAC signature verification failed', {
        path: req.path,
      });
      res.status(401).json({ error: 'invalid_signature' });
      return;
    }

    next();
  };
}

/**
 * Default Express middleware instance verifying incoming Horizon webhook events.
 */
export const horizonWebhookMiddleware = createHorizonWebhookMiddleware();
export const verifyHorizonWebhookSignature = horizonWebhookMiddleware;
