// Prometheus metrics (one registry per app instance so tests don't collide).
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export interface Metrics {
  registry: Registry;
  requests: Counter<'route' | 'status'>;
  duration: Histogram<'route'>;
  voiceErrors: Counter<'kind'>;
  fallbackActive: Gauge;
  flagParseErrors: Counter;
}

export function createMetrics(): Metrics {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });
  return {
    registry,
    requests: new Counter({ name: 'http_requests_total', help: 'HTTP requests', labelNames: ['route', 'status'], registers: [registry] }),
    duration: new Histogram({
      name: 'http_request_duration_seconds', help: 'HTTP latency', labelNames: ['route'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10], registers: [registry],
    }),
    voiceErrors: new Counter({ name: 'voice_errors_total', help: 'Voice pipeline errors', labelNames: ['kind'], registers: [registry] }),
    fallbackActive: new Gauge({ name: 'fallback_active', help: '1 when offline voice fallback is on', registers: [registry] }),
    flagParseErrors: new Counter({ name: 'flag_parse_errors_total', help: 'Flag values that failed to parse', registers: [registry] }),
  };
}
