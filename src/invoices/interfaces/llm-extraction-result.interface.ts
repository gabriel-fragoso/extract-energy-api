export interface LlmExtractionResult {
  clientNumber: string;
  referenceMonth: string;
  electricEnergyKwh: number;
  electricEnergyValue: number;
  sceeEnergyKwh: number;
  sceeEnergyValue: number;
  compensatedEnergyKwh: number;
  compensatedEnergyValue: number;
  publicLightingValue: number;
}
