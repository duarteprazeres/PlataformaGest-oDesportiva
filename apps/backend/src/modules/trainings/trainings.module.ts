import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { TrainingsController } from './trainings.controller';
import { TrainingsService } from './trainings.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
    imports: [
        MulterModule.register({
            storage: diskStorage({
                destination: './uploads',
                filename: (_req, file, cb) => {
                    const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                    cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
        }),
    ],
    controllers: [TrainingsController],
    providers: [TrainingsService, PrismaService],
})
export class TrainingsModule { }
