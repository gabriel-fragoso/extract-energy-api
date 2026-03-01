import { ApiProperty } from '@nestjs/swagger';

export class DashboardEnergyResponseDto {
  @ApiProperty({ example: 'JAN/2024' })
  month: string;

  @ApiProperty({ example: 595.08 })
  totalEnergyConsumptionKwh: number;

  @ApiProperty({ example: 220.5 })
  compensatedEnergyKwh: number;
}
