import type { FilterInvoicesDto } from '../dto/filter-invoices.dto';
import type { LlmExtractionResult } from './llm-extraction-result.interface';

export interface DerivedInvoiceFields {
  totalEnergyConsumptionKwh: number;
  totalValueWithoutGd: number;
  gdEconomyValue: number;
}

export type CreateInvoiceData = LlmExtractionResult &
  DerivedInvoiceFields & { pdfUrl?: string | null };

export interface InvoiceEnergyRow {
  referenceMonth: string;
  totalEnergyConsumptionKwh: number;
  compensatedEnergyKwh: number;
}

export interface InvoiceFinancialRow {
  referenceMonth: string;
  totalValueWithoutGd: number;
  gdEconomyValue: number;
}

export interface IInvoiceRepository {
  upsert(data: CreateInvoiceData): Promise<any>;
  findMany(filters: FilterInvoicesDto): Promise<any[]>;
  findManyForEnergyDashboard(
    filters: FilterInvoicesDto,
  ): Promise<InvoiceEnergyRow[]>;
  findManyForFinancialDashboard(
    filters: FilterInvoicesDto,
  ): Promise<InvoiceFinancialRow[]>;
}
