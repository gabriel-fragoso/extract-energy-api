import { ApiProperty } from '@nestjs/swagger';

export class InvoiceResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: '7005400387' })
  clientNumber: string;

  @ApiProperty({ example: 'JAN/2024' })
  referenceMonth: string;

  @ApiProperty({ example: 100.0 })
  electricEnergyKwh: number;

  @ApiProperty({ example: 89.34 })
  electricEnergyValue: number;

  @ApiProperty({ example: 495.08 })
  sceeEnergyKwh: number;

  @ApiProperty({ example: 152.36 })
  sceeEnergyValue: number;

  @ApiProperty({ example: 220.5 })
  compensatedEnergyKwh: number;

  @ApiProperty({ example: -95.26 })
  compensatedEnergyValue: number;

  @ApiProperty({ example: 49.38 })
  publicLightingValue: number;

  @ApiProperty({ example: 595.08 })
  totalEnergyConsumptionKwh: number;

  @ApiProperty({ example: 291.08 })
  totalValueWithoutGd: number;

  @ApiProperty({ example: 95.26 })
  gdEconomyValue: number;

  @ApiProperty({
    example: 'https://storage.example.com/invoice.pdf',
    nullable: true,
    required: false,
  })
  pdfUrl: string | null;
}
