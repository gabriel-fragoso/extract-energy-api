import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INVOICE_REPOSITORY } from '../constants/invoice.constants';
import type { LlmExtractionResult } from '../interfaces/llm-extraction-result.interface';
import { InvoicesService } from './invoices.service';
import { LlmService } from './llm.service';

const mockExtraction: LlmExtractionResult = {
  clientNumber: '7202210726',
  referenceMonth: 'SET/2024',
  electricEnergyKwh: 50,
  electricEnergyValue: 40.0,
  sceeEnergyKwh: 476,
  sceeEnergyValue: 200.0,
  compensatedEnergyKwh: 476,
  compensatedEnergyValue: -200.0,
  publicLightingValue: 30.0,
};

const mockInvoice = {
  id: 'uuid-1',
  clientNumber: '7202210726',
  referenceMonth: 'SET/2024',
  electricEnergyKwh: 50,
  electricEnergyValue: 40.0,
  sceeEnergyKwh: 476,
  sceeEnergyValue: 200.0,
  compensatedEnergyKwh: 476,
  compensatedEnergyValue: -200.0,
  publicLightingValue: 30.0,
  totalEnergyConsumptionKwh: 526,
  totalValueWithoutGd: 270.0,
  gdEconomyValue: 200.0,
  pdfUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLlmService = {
  extractInvoiceData: jest.fn(),
};

const mockInvoiceRepository = {
  upsert: jest.fn(),
  findMany: jest.fn(),
  findManyForEnergyDashboard: jest.fn(),
  findManyForFinancialDashboard: jest.fn(),
};

describe('InvoicesService', () => {
  let service: InvoicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: LlmService, useValue: mockLlmService },
        { provide: INVOICE_REPOSITORY, useValue: mockInvoiceRepository },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    jest.clearAllMocks();
  });

  describe('calculateDerivedFields', () => {
    it('should calculate totalEnergyConsumptionKwh as sum of electric + scee kWh', () => {
      const result = service.calculateDerivedFields(mockExtraction);
      expect(result.totalEnergyConsumptionKwh).toBe(526);
    });

    it('should calculate totalValueWithoutGd as sum of electric + scee + publicLighting values', () => {
      const result = service.calculateDerivedFields(mockExtraction);
      expect(result.totalValueWithoutGd).toBeCloseTo(270.0);
    });

    it('should calculate gdEconomyValue as absolute value of compensatedEnergyValue', () => {
      const result = service.calculateDerivedFields(mockExtraction);
      expect(result.gdEconomyValue).toBe(200.0);
    });

    it('should handle positive compensatedEnergyValue and still return positive gdEconomyValue', () => {
      const data = { ...mockExtraction, compensatedEnergyValue: 100.0 };
      const result = service.calculateDerivedFields(data);
      expect(result.gdEconomyValue).toBe(100.0);
    });
  });

  describe('processUpload', () => {
    const mockFile = {
      mimetype: 'application/pdf',
      buffer: Buffer.from('fake-pdf'),
      originalname: 'fatura.pdf',
    } as Express.Multer.File;

    it('should extract, calculate and persist the invoice', async () => {
      mockLlmService.extractInvoiceData.mockResolvedValue(mockExtraction);
      mockInvoiceRepository.upsert.mockResolvedValue(mockInvoice);

      const result = await service.processUpload(mockFile);

      expect(mockLlmService.extractInvoiceData).toHaveBeenCalledWith(mockFile.buffer);
      expect(mockInvoiceRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          totalEnergyConsumptionKwh: 526,
          totalValueWithoutGd: 270.0,
          gdEconomyValue: 200.0,
        }),
      );
      expect(result).toEqual(mockInvoice);
    });

    it('should throw BadRequestException when no file is provided', async () => {
      await expect(
        service.processUpload(undefined as unknown as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-PDF files', async () => {
      const nonPdf = { ...mockFile, mimetype: 'image/png' } as Express.Multer.File;
      await expect(service.processUpload(nonPdf)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException when LLM fails', async () => {
      mockLlmService.extractInvoiceData.mockRejectedValue(new Error('LLM unavailable'));
      await expect(service.processUpload(mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return invoices filtered by clientNumber', async () => {
      mockInvoiceRepository.findMany.mockResolvedValue([mockInvoice]);
      const result = await service.findAll({ clientNumber: '7202210726' });
      expect(mockInvoiceRepository.findMany).toHaveBeenCalledWith({
        clientNumber: '7202210726',
      });
      expect(result).toHaveLength(1);
    });

    it('should return all invoices when no filters are provided', async () => {
      mockInvoiceRepository.findMany.mockResolvedValue([mockInvoice]);
      await service.findAll({});
      expect(mockInvoiceRepository.findMany).toHaveBeenCalledWith({});
    });
  });

  describe('getDashboardEnergy', () => {
    it('should return energy dashboard results', async () => {
      mockInvoiceRepository.findManyForEnergyDashboard.mockResolvedValue([
        {
          referenceMonth: 'SET/2024',
          totalEnergyConsumptionKwh: 526,
          compensatedEnergyKwh: 476,
        },
      ]);

      const result = await service.getDashboardEnergy({});
      expect(result).toEqual([
        {
          month: 'SET/2024',
          totalEnergyConsumptionKwh: 526,
          compensatedEnergyKwh: 476,
        },
      ]);
    });
  });

  describe('getDashboardFinancial', () => {
    it('should return financial dashboard results', async () => {
      mockInvoiceRepository.findManyForFinancialDashboard.mockResolvedValue([
        {
          referenceMonth: 'SET/2024',
          totalValueWithoutGd: 270.0,
          gdEconomyValue: 200.0,
        },
      ]);

      const result = await service.getDashboardFinancial({});
      expect(result).toEqual([
        {
          month: 'SET/2024',
          totalValueWithoutGd: 270.0,
          gdEconomyValue: 200.0,
        },
      ]);
    });
  });
});
