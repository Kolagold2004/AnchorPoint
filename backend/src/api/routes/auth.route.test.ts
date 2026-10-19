import request from 'supertest';
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

let sep10ChallengeLimiter: RequestHandler;

jest.mock('../middleware/rate-limit.middleware', () => ({
  sep10ChallengeLimiter: (req: Request, res: Response, next: NextFunction) => sep10ChallengeLimiter(req, res, next),
}));

import authRouter from './auth.route';

beforeEach(() => {
  sep10ChallengeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: true,
    message: { error: 'Too many challenge requests, please try again later.' },
  });
});

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/sep10', sep10ChallengeLimiter, authRouter);
  app.use('/auth', sep10ChallengeLimiter, authRouter);
  return app;
};

describe('SEP-10 challenge rate limiting', () => {
  it('should return 429 when the challenge rate limit is exceeded', async () => {
    const app = createApp();

    for (let i = 0; i < 10; i++) {
      await request(app).post('/sep10').send({ account: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' });
    }

    const response = await request(app)
      .post('/sep10')
      .send({ account: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' });

    expect(response.status).toBe(429);
    expect(response.body).toEqual({ error: 'Too many challenge requests, please try again later.' });
  });

  it('should expose X-RateLimit-Limit and X-RateLimit-Remaining headers', async () => {
    const app = createApp();

    const withinLimit = await request(app)
      .post('/sep10')
      .send({ account: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' });

    expect(withinLimit.status).not.toBe(429);
    expect(withinLimit.headers['x-ratelimit-limit']).toBe('10');
    expect(withinLimit.headers['x-ratelimit-remaining']).toBeDefined();
    const remaining = parseInt(withinLimit.headers['x-ratelimit-remaining'] as string, 10);
    expect(remaining).toBeGreaterThanOrEqual(0);
    expect(remaining).toBeLessThanOrEqual(9);
  });

  it('should decrement X-RateLimit-Remaining as requests consume the limit', async () => {
    const app = createApp();

    const first = await request(app)
      .post('/sep10')
      .send({ account: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' });
    const second = await request(app)
      .post('/sep10')
      .send({ account: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' });

    const remainingAfterFirst = parseInt(first.headers['x-ratelimit-remaining'] as string, 10);
    const remainingAfterSecond = parseInt(second.headers['x-ratelimit-remaining'] as string, 10);

    expect(remainingAfterFirst).toBeGreaterThan(remainingAfterSecond);
  });

  it('should apply the same limit to the GET challenge endpoint', async () => {
    const app = createApp();

    for (let i = 0; i < 10; i++) {
      await request(app).get('/sep10?account=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
    }

    const response = await request(app).get('/sep10?account=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');

    expect(response.status).toBe(429);
  });
});

describe('GET /auth challenge generation', () => {
  it('returns 400 when the account query parameter is missing', async () => {
    const challengeApp = express();
    challengeApp.use(express.json());
    challengeApp.use('/auth', authRouter);

    const response = await request(challengeApp).get('/auth');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'account parameter is required' });
  });
});

describe('JWT refresh token rotation routes (POST /sep10/auth & POST /auth/refresh)', () => {
  const TEST_SIGNER = 'GSIGNER1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

  const createRotationApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/sep10', authRouter);
    app.use('/auth', authRouter);
    return app;
  };

  it('POST /sep10/auth returns access_token (15 min TTL) and refresh_token (7 day TTL)', async () => {
    const app = createRotationApp();

    // 1. Generate a challenge
    await request(app)
      .post('/sep10')
      .send({
        account: TEST_SIGNER,
        multiKey: true,
        threshold: 'low',
        signers: [{ publicKey: TEST_SIGNER, weight: 1, signed: false }],
      });

    // Wait or use stored challenge via authService
    const { redisService } = require('./auth.route');
    const { storeChallenge } = require('../../services/auth.service');
    await storeChallenge(redisService, TEST_SIGNER, 'signed-challenge-xdr');

    // 2. Exchange challenge for tokens via POST /sep10/auth
    const authRes = await request(app)
      .post('/sep10/auth')
      .send({
        transaction: 'signed-challenge-xdr',
        threshold: 'low',
        signatures: [{ publicKey: TEST_SIGNER, signature: 'sig-1', weight: 1 }],
      });

    expect(authRes.status).toBe(200);
    expect(authRes.body.access_token).toBeDefined();
    expect(authRes.body.refresh_token).toBeDefined();
    expect(authRes.body.expires_in).toBe(900); // 15 min TTL
    expect(authRes.body.refresh_expires_in).toBe(604800); // 7 day TTL
  });

  it('POST /auth/refresh rotates refresh token and invalidates old token; reuse invalidates session family', async () => {
    const app = createRotationApp();
    const { redisService } = require('./auth.route');
    const { storeChallenge } = require('../../services/auth.service');

    await storeChallenge(redisService, TEST_SIGNER, 'challenge-for-rotation');

    const authRes = await request(app)
      .post('/sep10/auth')
      .send({
        transaction: 'challenge-for-rotation',
        threshold: 'low',
        signatures: [{ publicKey: TEST_SIGNER, signature: 'sig-1', weight: 1 }],
      });

    expect(authRes.status).toBe(200);
    const { refresh_token: refreshToken1 } = authRes.body;

    // Rotate refresh token 1 -> get pair 2
    const refreshRes1 = await request(app)
      .post('/auth/refresh')
      .send({ refresh_token: refreshToken1 });

    expect(refreshRes1.status).toBe(200);
    expect(refreshRes1.body.access_token).toBeDefined();
    expect(refreshRes1.body.refresh_token).toBeDefined();
    expect(refreshRes1.body.refresh_token).not.toBe(refreshToken1);
    expect(refreshRes1.body.expires_in).toBe(900);

    const refreshToken2 = refreshRes1.body.refresh_token;

    // Reusing old refreshToken1 triggers security alert and invalidates the entire session family
    const reuseRes = await request(app)
      .post('/auth/refresh')
      .send({ refresh_token: refreshToken1 });

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.code).toBe('REFRESH_TOKEN_REUSE');

    // Now even the latest refreshToken2 in the family is invalidated
    const familyInvalidatedRes = await request(app)
      .post('/auth/refresh')
      .send({ refresh_token: refreshToken2 });

    expect(familyInvalidatedRes.status).toBe(401);
  });
});
