import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { FilterInvoicesDto } from '../dto/filter-invoices.dto';
import type {
  CreateInvoiceData,
  IInvoiceRepository,
  InvoiceEnergyRow,
  InvoiceFinancialRow,
} from '../interfaces/invoice-repository.interface';

@Injectable()
export class InvoiceRepository implements IInvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhereClause(filters: FilterInvoicesDto) {
    return {
      ...(filters.clientNumber && { clientNumber: filters.clientNumber }),
      ...(filters.referenceMonth && { referenceMonth: filters.referenceMonth }),
    };
  }

  async upsert(data: CreateInvoiceData) {
    const { clientNumber, referenceMonth, ...updateData } = data;
    return this.prisma.invoice.upsert({
      where: {
        clientNumber_referenceMonth: { clientNumber, referenceMonth },
      },
      create: data,
      update: updateData,
    });
  }

  async findMany(filters: FilterInvoicesDto) {
    return this.prisma.invoice.findMany({
      where: this.buildWhereClause(filters),
      orderBy: [{ clientNumber: 'asc' }, { referenceMonth: 'asc' }],
    });
  }

  async findManyForEnergyDashboard(filters: FilterInvoicesDto): Promise<InvoiceEnergyRow[]> {
    return this.prisma.invoice.findMany({
      where: this.buildWhereClause(filters),
      select: {
        referenceMonth: true,
        totalEnergyConsumptionKwh: true,
        compensatedEnergyKwh: true,
      },
      orderBy: { referenceMonth: 'asc' },
    });
  }

  async findManyForFinancialDashboard(
    filters: FilterInvoicesDto,
  ): Promise<InvoiceFinancialRow[]> {
    return this.prisma.invoice.findMany({
      where: this.buildWhereClause(filters),
      select: {
        referenceMonth: true,
        totalValueWithoutGd: true,
        gdEconomyValue: true,
      },
      orderBy: { referenceMonth: 'asc' },
    });
  }
}
