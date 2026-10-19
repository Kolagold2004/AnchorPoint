import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../../services/metrics.service';

/**
 * #1330: Middleware factory that records the duration of every request handled
 * by a SEP router into the `sep_flow_duration_seconds` histogram.
 */
export function sepFlowMetricsMiddleware(sep: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
      // Use the matched route pattern (not the raw path) to keep label cardinality bounded.
      const operation = req.route?.path ? `${req.method} ${req.route.path}` : `${req.method} unmatched`;
      const status = res.statusCode >= 400 ? 'error' : 'success';
      metricsService.observeSepFlowDuration(sep, operation, status, durationSeconds);
    });

    next();
  };
}
