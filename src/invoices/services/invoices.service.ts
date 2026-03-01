import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ALLOWED_MIME_TYPE,
  INVOICE_REPOSITORY,
} from '../constants/invoice.constants';
import type { FilterInvoicesDto } from '../dto/filter-invoices.dto';
import type {
  DashboardEnergyResult,
  DashboardFinancialResult,
} from '../interfaces/dashboard.interface';
import type { IInvoiceRepository } from '../interfaces/invoice-repository.interface';
import type { LlmExtractionResult } from '../interfaces/llm-extraction-result.interface';
import { InvoiceMapper } from '../mappers/invoice.mapper';
import { LlmService } from './llm.service';

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly llm: LlmService,
    private readonly configService: ConfigService,
  ) {}

  async processUpload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (file.mimetype !== ALLOWED_MIME_TYPE) {
      throw new BadRequestException('Only PDF files are accepted');
    }

    let extracted: LlmExtractionResult;
    try {
      extracted = await this.llm.extractInvoiceData(file.buffer);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(
        `LLM extraction failed: ${message}`,
      );
    }

    const pdfUrl = await this.savePdf(
      file.buffer,
      extracted.clientNumber,
      extracted.referenceMonth,
    );

    return this.invoiceRepository.upsert({
      ...extracted,
      ...this.calculateDerivedFields(extracted),
      pdfUrl,
    });
  }

  private async savePdf(
    buffer: Buffer,
    clientNumber: string,
    referenceMonth: string,
  ): Promise<string> {
    const uploadsDir = join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const sanitizedMonth = referenceMonth.replace('/', '-');
    const filename = `${clientNumber}_${sanitizedMonth}.pdf`;
    await writeFile(join(uploadsDir, filename), buffer);

    const baseUrl =
      this.configService.get<string>('BASE_URL') ??
      `http://localhost:${this.configService.get<string>('PORT') ?? '3000'}`;
    return `${baseUrl}/uploads/${filename}`;
  }

  async findAll(filters: FilterInvoicesDto) {
    return this.invoiceRepository.findMany(filters);
  }

  async getDashboardEnergy(
    filters: FilterInvoicesDto,
  ): Promise<DashboardEnergyResult[]> {
    const rows =
      await this.invoiceRepository.findManyForEnergyDashboard(filters);
    return rows.map(InvoiceMapper.toEnergyDashboard);
  }

  async getDashboardFinancial(
    filters: FilterInvoicesDto,
  ): Promise<DashboardFinancialResult[]> {
    const rows =
      await this.invoiceRepository.findManyForFinancialDashboard(filters);
    return rows.map(InvoiceMapper.toFinancialDashboard);
  }

  calculateDerivedFields(data: LlmExtractionResult) {
    return {
      totalEnergyConsumptionKwh: data.electricEnergyKwh + data.sceeEnergyKwh,
      totalValueWithoutGd:
        data.electricEnergyValue +
        data.sceeEnergyValue +
        data.publicLightingValue,
      gdEconomyValue: Math.abs(data.compensatedEnergyValue),
    };
  }
}
