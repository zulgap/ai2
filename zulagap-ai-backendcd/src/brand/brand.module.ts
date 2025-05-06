import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [BrandController],
  providers: [BrandService, PrismaService],
  exports: [BrandService],
})
export class BrandModule {}