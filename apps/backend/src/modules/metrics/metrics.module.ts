import { Global, Module } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    MetricsService,
    makeCounterProvider({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['context'],
    }),
    makeCounterProvider({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['context'],
    }),
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
