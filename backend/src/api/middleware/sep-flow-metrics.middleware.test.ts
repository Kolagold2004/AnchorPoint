import express from 'express';
import request from 'supertest';
import { sepFlowMetricsMiddleware } from './sep-flow-metrics.middleware';
import { metricsService } from '../../services/metrics.service';

describe('sepFlowMetricsMiddleware', () => {
  beforeEach(() => {
    metricsService.reset();
  });

  const buildApp = () => {
    const app = express();
    const router = express.Router();
    router.use(sepFlowMetricsMiddleware('sep6'));
    router.get('/info', (_req, res) => { res.json({ ok: true }); });
    router.get('/fail', (_req, res) => { res.status(400).json({ error: 'bad' }); });
    app.use('/sep6', router);
    return app;
  };

  it('records sep_flow_duration_seconds with sep, operation and success status', async () => {
    await request(buildApp()).get('/sep6/info');

    const metrics = await metricsService.getMetrics();
    expect(metrics).toMatch(
      /sep_flow_duration_seconds_count\{[^}]*sep="sep6"[^}]*operation="GET \/info"[^}]*status="success"[^}]*\} 1/
    );
  });

  it('records error status for failed requests', async () => {
    await request(buildApp()).get('/sep6/fail');

    const metrics = await metricsService.getMetrics();
    expect(metrics).toMatch(
      /sep_flow_duration_seconds_count\{[^}]*sep="sep6"[^}]*operation="GET \/fail"[^}]*status="error"[^}]*\} 1/
    );
  });
});
