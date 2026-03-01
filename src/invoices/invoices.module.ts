import { Module } from '@nestjs/common';
import { INVOICE_REPOSITORY } from './constants/invoice.constants';
import { InvoicesController } from './controllers/invoices.controller';
import { InvoiceRepository } from './repositories/invoice.repository';
import { InvoicesService } from './services/invoices.service';
import { LlmService } from './services/llm.service';

@Module({
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    LlmService,
    {
      provide: INVOICE_REPOSITORY,
      useClass: InvoiceRepository,
    },
  ],
})
export class InvoicesModule {}
