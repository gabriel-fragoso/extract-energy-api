export interface DashboardEnergyResult {
  month: string;
  totalEnergyConsumptionKwh: number;
  compensatedEnergyKwh: number;
}

export interface DashboardFinancialResult {
  month: string;
  totalValueWithoutGd: number;
  gdEconomyValue: number;
}
