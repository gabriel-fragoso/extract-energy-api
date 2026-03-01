import { ApiProperty } from '@nestjs/swagger';

export class DashboardFinancialResponseDto {
  @ApiProperty({ example: 'JAN/2024' })
  month: string;

  @ApiProperty({ example: 291.08 })
  totalValueWithoutGd: number;

  @ApiProperty({ example: 95.26 })
  gdEconomyValue: number;
}
