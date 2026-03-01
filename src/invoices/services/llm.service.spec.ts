import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'ANTHROPIC_API_KEY') return 'test-api-key';
    if (key === 'ANTHROPIC_MODEL') return 'claude-sonnet-4-20250514';
    return undefined;
  }),
};

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
      },
    })),
  };
});

describe('LlmService', () => {
  let service: LlmService;
  let anthropicCreateMock: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AnthropicMock = require('@anthropic-ai/sdk').default;
    anthropicCreateMock = AnthropicMock.mock.results[0]?.value?.messages?.create;
    jest.clearAllMocks();
  });

  describe('extractInvoiceData', () => {
    const validResponse = {
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

    it('should parse and return structured data from LLM response', async () => {
      anthropicCreateMock.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(validResponse) }],
      });

      const result = await service.extractInvoiceData(Buffer.from('fake-pdf'));
      expect(result.clientNumber).toBe('7202210726');
      expect(result.referenceMonth).toBe('SET/2024');
      expect(result.electricEnergyKwh).toBe(50);
    });

    it('should throw when LLM returns empty content', async () => {
      anthropicCreateMock.mockResolvedValue({ content: [] });
      await expect(
        service.extractInvoiceData(Buffer.from('fake-pdf')),
      ).rejects.toThrow('LLM returned an empty response');
    });

    it('should throw when a required field is missing', async () => {
      const incomplete = { ...validResponse, clientNumber: undefined };
      anthropicCreateMock.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(incomplete) }],
      });
      await expect(
        service.extractInvoiceData(Buffer.from('fake-pdf')),
      ).rejects.toThrow('LLM extraction missing required field: clientNumber');
    });

    it('should throw when referenceMonth has invalid format', async () => {
      const invalid = { ...validResponse, referenceMonth: '09/2024' };
      anthropicCreateMock.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(invalid) }],
      });
      await expect(
        service.extractInvoiceData(Buffer.from('fake-pdf')),
      ).rejects.toThrow('referenceMonth must match pattern MMM/YYYY');
    });

    it('should throw when a numeric field is not a number', async () => {
      const invalid = { ...validResponse, electricEnergyKwh: 'not-a-number' };
      anthropicCreateMock.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(invalid) }],
      });
      await expect(
        service.extractInvoiceData(Buffer.from('fake-pdf')),
      ).rejects.toThrow('Field electricEnergyKwh must be a valid number');
    });
  });
});
