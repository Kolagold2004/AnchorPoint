import express, { Request, Response } from 'express';
import request from 'supertest';
import {
  computeHorizonSignature,
  formatStellarSignatureHeader,
  parseStellarSignatureHeader,
  createHorizonWebhookMiddleware,
  horizonWebhookMiddleware,
} from './horizon-webhook.middleware';

describe('horizon-webhook.middleware', () => {
  const secret = 'horizon-shared-secret-key';
  const payloadObj = {
    id: 'evt_12345',
    type: 'payment',
    asset_code: 'USDC',
    amount: '250.00',
  };
  const rawBody = JSON.stringify(payloadObj);

  const originalEnvSecret = process.env.HORIZON_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.HORIZON_WEBHOOK_SECRET = secret;
  });

  afterEach(() => {
    if (originalEnvSecret === undefined) {
      delete process.env.HORIZON_WEBHOOK_SECRET;
    } else {
      process.env.HORIZON_WEBHOOK_SECRET = originalEnvSecret;
    }
  });

  function makeMockReq(
    overrides: Partial<{
      headers: Record<string, string | string[] | undefined>;
      body: unknown;
      rawBody: string | Buffer;
      path: string;
    }> = {},
  ): Request {
    return {
      headers: {},
      body: payloadObj,
      rawBody,
      path: '/api/events/horizon',
      ...overrides,
    } as unknown as Request;
  }

  function makeMockRes(): { res: Response; status: jest.Mock; json: jest.Mock } {
    const json = jest.fn().mockReturnThis();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status, json } as unknown as Response;
    return { res, status, json };
  }

  describe('parseStellarSignatureHeader', () => {
    it('parses t=<ts>,v1=<hex> format', () => {
      const parsed = parseStellarSignatureHeader('t=1700000000,v1=abcdef123456');
      expect(parsed).toEqual({
        timestamp: '1700000000',
        signature: 'abcdef123456',
      });
    });

    it('parses t=<ts>,sha256=<hex> format', () => {
      const parsed = parseStellarSignatureHeader('t=1700000000,sha256=abcdef123456');
      expect(parsed).toEqual({
        timestamp: '1700000000',
        signature: 'abcdef123456',
      });
    });

    it('parses <ts>.<hex> format', () => {
      const parsed = parseStellarSignatureHeader('1700000000.abcdef123456');
      expect(parsed).toEqual({
        timestamp: '1700000000',
        signature: 'abcdef123456',
      });
    });

    it('parses raw sha256=<hex> format without embedded timestamp', () => {
      const parsed = parseStellarSignatureHeader('sha256=abcdef123456');
      expect(parsed).toEqual({
        signature: 'abcdef123456',
      });
    });

    it('returns null on empty header', () => {
      expect(parseStellarSignatureHeader('   ')).toBeNull();
    });
  });

  describe('middleware verification', () => {
    it('calls next() for a valid X-Stellar-Signature header (t=<ts>,v1=<hex>)', () => {
      const ts = Math.floor(Date.now() / 1000);
      const header = formatStellarSignatureHeader(rawBody, secret, ts);
      const req = makeMockReq({
        headers: { 'x-stellar-signature': header },
      });
      const { res, status } = makeMockRes();
      const next = jest.fn();

      horizonWebhookMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(status).not.toHaveBeenCalled();
    });

    it('calls next() when signature uses separate X-Stellar-Timestamp header', () => {
      const ts = String(Math.floor(Date.now() / 1000));
      const sig = computeHorizonSignature(rawBody, secret, ts);
      const req = makeMockReq({
        headers: {
          'x-stellar-signature': `sha256=${sig}`,
          'x-stellar-timestamp': ts,
        },
      });
      const { res, status } = makeMockRes();
      const next = jest.fn();

      horizonWebhookMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(status).not.toHaveBeenCalled();
    });

    it('calls next() when signature is computed over raw body and timestamp is in payload', () => {
      const ts = Math.floor(Date.now() / 1000);
      const bodyWithTs = { ...payloadObj, timestamp: ts };
      const bodyStr = JSON.stringify(bodyWithTs);
      const sig = computeHorizonSignature(bodyStr, secret);
      const req = makeMockReq({
        headers: { 'x-stellar-signature': sig },
        body: bodyWithTs,
        rawBody: bodyStr,
      });
      const { res, status } = makeMockRes();
      const next = jest.fn();

      horizonWebhookMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(status).not.toHaveBeenCalled();
    });

    it('returns 401 when X-Stellar-Signature header is missing', () => {
      const req = makeMockReq({ headers: {} });
      const { res, status, json } = makeMockRes();
      const next = jest.fn();

      horizonWebhookMiddleware(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ error: 'missing_signature' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when HORIZON_WEBHOOK_SECRET is not configured', () => {
      delete process.env.HORIZON_WEBHOOK_SECRET;
      const ts = Math.floor(Date.now() / 1000);
      const header = formatStellarSignatureHeader(rawBody, secret, ts);
      const req = makeMockReq({
        headers: { 'x-stellar-signature': header },
      });
      const { res, status, json } = makeMockRes();
      const next = jest.fn();

      horizonWebhookMiddleware(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ error: 'webhook_secret_not_configured' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when signature is invalid', () => {
      const ts = Math.floor(Date.now() / 1000);
      const header = formatStellarSignatureHeader(rawBody, 'wrong-secret', ts);
      const req = makeMockReq({
        headers: { 'x-stellar-signature': header },
      });
      const { res, status, json } = makeMockRes();
      const next = jest.fn();

      horizonWebhookMiddleware(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ error: 'invalid_signature' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when request body has been tampered with', () => {
      const ts = Math.floor(Date.now() / 1000);
      const header = formatStellarSignatureHeader(rawBody, secret, ts);
      const tamperedBody = JSON.stringify({ ...payloadObj, amount: '999999.00' });
      const req = makeMockReq({
        headers: { 'x-stellar-signature': header },
        rawBody: tamperedBody,
      });
      const { res, status, json } = makeMockRes();
      const next = jest.fn();

      horizonWebhookMiddleware(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ error: 'invalid_signature' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when timestamp is older than 5 minutes (replay prevention)', () => {
      const staleTs = Math.floor(Date.now() / 1000) - 301; // 5m 1s ago
      const header = formatStellarSignatureHeader(rawBody, secret, staleTs);
      const req = makeMockReq({
        headers: { 'x-stellar-signature': header },
      });
      const { res, status, json } = makeMockRes();
      const next = jest.fn();

      horizonWebhookMiddleware(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ error: 'timestamp_too_old' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when timestamp is more than 5 minutes in the future', () => {
      const futureTs = Math.floor(Date.now() / 1000) + 305;
      const header = formatStellarSignatureHeader(rawBody, secret, futureTs);
      const req = makeMockReq({
        headers: { 'x-stellar-signature': header },
      });
      const { res, status, json } = makeMockRes();
      const next = jest.fn();

      horizonWebhookMiddleware(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ error: 'timestamp_too_old' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when timestamp is missing', () => {
      const sig = computeHorizonSignature(rawBody, secret);
      const req = makeMockReq({
        headers: { 'x-stellar-signature': `sha256=${sig}` },
      });
      const { res, status, json } = makeMockRes();
      const next = jest.fn();

      horizonWebhookMiddleware(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ error: 'missing_timestamp' });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when timestamp is non-numeric / invalid', () => {
      const req = makeMockReq({
        headers: { 'x-stellar-signature': 't=not-a-timestamp,v1=abcdef' },
      });
      const { res, status, json } = makeMockRes();
      const next = jest.fn();

      horizonWebhookMiddleware(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({ error: 'invalid_timestamp' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Express integration with rawBody capture', () => {
    const app = express();
    app.use(
      express.json({
        verify: (req: Request & { rawBody?: string }, _res: Response, buf: Buffer) => {
          req.rawBody = buf.toString('utf8');
        },
      }),
    );
    app.post('/webhook/horizon', createHorizonWebhookMiddleware(), (_req, res) => {
      res.status(200).json({ received: true });
    });

    it('accepts valid signed webhook callback over HTTP', async () => {
      const ts = Math.floor(Date.now() / 1000);
      const bodyStr = JSON.stringify(payloadObj);
      const signatureHeader = formatStellarSignatureHeader(bodyStr, secret, ts);

      const res = await request(app)
        .post('/webhook/horizon')
        .set('Content-Type', 'application/json')
        .set('X-Stellar-Signature', signatureHeader)
        .send(bodyStr);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
    });

    it('rejects unsigned webhook callback with 401', async () => {
      const res = await request(app)
        .post('/webhook/horizon')
        .send(payloadObj);

      expect(res.status).toBe(401);
    });
  });
});
