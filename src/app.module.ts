import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InvoicesModule } from './invoices/invoices.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    InvoicesModule,
  ],
})
export class AppModule {}
