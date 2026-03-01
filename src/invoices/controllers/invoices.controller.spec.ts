import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from '../services/invoices.service';

const mockInvoice = {
  id: 'uuid-1',
  clientNumber: '7202210726',
  referenceMonth: 'SET/2024',
  totalEnergyConsumptionKwh: 526,
  totalValueWithoutGd: 270.0,
  gdEconomyValue: 200.0,
};

const mockInvoicesService = {
  processUpload: jest.fn(),
  findAll: jest.fn(),
  getDashboardEnergy: jest.fn(),
  getDashboardFinancial: jest.fn(),
};

describe('InvoicesController', () => {
  let controller: InvoicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [
        { provide: InvoicesService, useValue: mockInvoicesService },
      ],
    }).compile();

    controller = module.get<InvoicesController>(InvoicesController);
    jest.clearAllMocks();
  });

  describe('POST /invoices/upload', () => {
    const mockFile = {
      mimetype: 'application/pdf',
      buffer: Buffer.from('fake-pdf'),
      originalname: 'fatura.pdf',
    } as Express.Multer.File;

    it('should call processUpload and return the created invoice', async () => {
      mockInvoicesService.processUpload.mockResolvedValue(mockInvoice);
      const result = await controller.upload(mockFile);
      expect(mockInvoicesService.processUpload).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockInvoice);
    });

    it('should propagate BadRequestException for invalid file', async () => {
      mockInvoicesService.processUpload.mockRejectedValue(
        new BadRequestException('Only PDF files are accepted'),
      );
      await expect(controller.upload(mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should propagate InternalServerErrorException on LLM failure', async () => {
      mockInvoicesService.processUpload.mockRejectedValue(
        new InternalServerErrorException('LLM extraction failed'),
      );
      await expect(controller.upload(mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('GET /invoices', () => {
    it('should return list of invoices', async () => {
      mockInvoicesService.findAll.mockResolvedValue([mockInvoice]);
      const result = await controller.findAll({});
      expect(result).toHaveLength(1);
    });

    it('should pass filters to the service', async () => {
      mockInvoicesService.findAll.mockResolvedValue([]);
      await controller.findAll({ clientNumber: '7202210726' });
      expect(mockInvoicesService.findAll).toHaveBeenCalledWith({
        clientNumber: '7202210726',
      });
    });
  });

  describe('GET /invoices/dashboard/energy', () => {
    it('should return energy dashboard data', async () => {
      const expected = [
        { month: 'SET/2024', totalEnergyConsumptionKwh: 526, compensatedEnergyKwh: 476 },
      ];
      mockInvoicesService.getDashboardEnergy.mockResolvedValue(expected);
      const result = await controller.dashboardEnergy({});
      expect(result).toEqual(expected);
    });
  });

  describe('GET /invoices/dashboard/financial', () => {
    it('should return financial dashboard data', async () => {
      const expected = [
        { month: 'SET/2024', totalValueWithoutGd: 270.0, gdEconomyValue: 200.0 },
      ];
      mockInvoicesService.getDashboardFinancial.mockResolvedValue(expected);
      const result = await controller.dashboardFinancial({});
      expect(result).toEqual(expected);
    });
  });
});
