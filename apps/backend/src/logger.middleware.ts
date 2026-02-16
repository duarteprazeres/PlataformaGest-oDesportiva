import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl, body } = req;

        this.logger.log(`Request ${method} ${originalUrl}`);
        if (Object.keys(body).length > 0) {
            this.logger.debug(`Body: ${JSON.stringify(body)}`);
        }

        const start = Date.now();
        res.on('finish', () => {
            const { statusCode } = res;
            const duration = Date.now() - start;
            this.logger.log(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
        });

        next();
    }
}
