import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LLM_EXTRACTION_PROMPT,
  REFERENCE_MONTH_PATTERN,
} from '../constants/invoice.constants';
import type { LlmExtractionResult } from '../interfaces/llm-extraction-result.interface';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.client = new Anthropic({ apiKey });
    this.model =
      this.configService.get<string>('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-20250514';
  }

  async extractInvoiceData(pdfBuffer: Buffer): Promise<LlmExtractionResult> {
    const base64Pdf = pdfBuffer.toString('base64');

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Pdf,
              },
            },
            { type: 'text', text: LLM_EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const text = textBlock && 'text' in textBlock ? textBlock.text.trim() : '';
    if (!text) {
      throw new Error('LLM returned an empty response');
    }

    this.logger.debug(`LLM raw response: ${text}`);

    const parsed = JSON.parse(text) as LlmExtractionResult;
    this.validateExtraction(parsed);

    return parsed;
  }

  private validateExtraction(data: LlmExtractionResult): void {
    const requiredFields: (keyof LlmExtractionResult)[] = [
      'clientNumber',
      'referenceMonth',
      'electricEnergyKwh',
      'electricEnergyValue',
      'sceeEnergyKwh',
      'sceeEnergyValue',
      'compensatedEnergyKwh',
      'compensatedEnergyValue',
      'publicLightingValue',
    ];

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        throw new Error(`LLM extraction missing required field: ${field}`);
      }
    }

    const numericFields: (keyof LlmExtractionResult)[] = [
      'electricEnergyKwh',
      'electricEnergyValue',
      'sceeEnergyKwh',
      'sceeEnergyValue',
      'compensatedEnergyKwh',
      'compensatedEnergyValue',
      'publicLightingValue',
    ];

    for (const field of numericFields) {
      if (typeof data[field] !== 'number' || isNaN(data[field] as number)) {
        throw new Error(`Field ${field} must be a valid number, got: ${data[field]}`);
      }
    }

    if (typeof data.clientNumber !== 'string' || !data.clientNumber.trim()) {
      throw new Error('clientNumber must be a non-empty string');
    }

    if (!REFERENCE_MONTH_PATTERN.test(data.referenceMonth)) {
      throw new Error(
        `referenceMonth must match pattern MMM/YYYY, got: ${data.referenceMonth}`,
      );
    }
  }
}
