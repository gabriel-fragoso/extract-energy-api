import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { DashboardEnergyResponseDto } from '../dto/dashboard-energy-response.dto';
import { DashboardFinancialResponseDto } from '../dto/dashboard-financial-response.dto';
import { FilterInvoicesDto } from '../dto/filter-invoices.dto';
import { InvoiceResponseDto } from '../dto/invoice-response.dto';
import { InvoicesService } from '../services/invoices.service';

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiOperation({
    summary:
      'Faz o upload de uma fatura em PDF para extração e armazenamento dos dados',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo PDF da fatura de energia elétrica',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Fatura processada e armazenada com sucesso',
    type: InvoiceResponseDto,
  })
  async upload(@UploadedFile() file: Express.Multer.File) {
    const response = await this.invoicesService.processUpload(file);

    return response;
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as faturas com filtros opcionais' })
  @ApiOkResponse({
    description: 'Lista de faturas retornada com sucesso',
    type: [InvoiceResponseDto],
  })
  async findAll(@Query() filters: FilterInvoicesDto) {
    const response = await this.invoicesService.findAll(filters);

    return response;
  }

  @Get('dashboard/energy')
  @ApiOperation({
    summary: 'Retorna dados de consumo de energia agrupados por mês',
  })
  @ApiOkResponse({
    description: 'Dados do dashboard de energia retornados com sucesso',
    type: [DashboardEnergyResponseDto],
  })
  async dashboardEnergy(@Query() filters: FilterInvoicesDto) {
    const response = await this.invoicesService.getDashboardEnergy(filters);

    return response;
  }

  @Get('dashboard/financial')
  @ApiOperation({ summary: 'Retorna dados financeiros agrupados por mês' })
  @ApiOkResponse({
    description: 'Dados do dashboard financeiro retornados com sucesso',
    type: [DashboardFinancialResponseDto],
  })
  async dashboardFinancial(@Query() filters: FilterInvoicesDto) {
    const response = await this.invoicesService.getDashboardFinancial(filters);

    return response;
  }
}
