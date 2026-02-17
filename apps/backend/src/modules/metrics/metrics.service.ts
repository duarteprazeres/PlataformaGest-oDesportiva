import { Injectable } from '@nestjs/common';
import { Counter } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('cache_hits_total') public cacheHits: Counter<string>,
    @InjectMetric('cache_misses_total') public cacheMisses: Counter<string>,
  ) {}

  incrementCacheHit(context: string) {
    this.cacheHits.labels(context).inc();
  }

  incrementCacheMiss(context: string) {
    this.cacheMisses.labels(context).inc();
  }
}
