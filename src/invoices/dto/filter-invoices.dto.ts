import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterInvoicesDto {
  @ApiPropertyOptional({
    description: 'Número do cliente para filtrar as faturas',
    example: '7005400387',
  })
  @IsOptional()
  @IsString()
  clientNumber?: string;

  @ApiPropertyOptional({
    description: 'Mês de referência para filtrar as faturas',
    example: 'JAN/2024',
  })
  @IsOptional()
  @IsString()
  referenceMonth?: string;
}
