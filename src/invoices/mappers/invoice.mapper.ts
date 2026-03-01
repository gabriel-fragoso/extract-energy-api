import type {
  DashboardEnergyResult,
  DashboardFinancialResult,
} from '../interfaces/dashboard.interface';
import type {
  InvoiceEnergyRow,
  InvoiceFinancialRow,
} from '../interfaces/invoice-repository.interface';

export class InvoiceMapper {
  static toEnergyDashboard(row: InvoiceEnergyRow): DashboardEnergyResult {
    return {
      month: row.referenceMonth,
      totalEnergyConsumptionKwh: row.totalEnergyConsumptionKwh,
      compensatedEnergyKwh: row.compensatedEnergyKwh,
    };
  }

  static toFinancialDashboard(row: InvoiceFinancialRow): DashboardFinancialResult {
    return {
      month: row.referenceMonth,
      totalValueWithoutGd: row.totalValueWithoutGd,
      gdEconomyValue: row.gdEconomyValue,
    };
  }
}
