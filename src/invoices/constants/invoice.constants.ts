export const INVOICE_REPOSITORY = 'INVOICE_REPOSITORY';

export const ALLOWED_MIME_TYPE = 'application/pdf';

export const REFERENCE_MONTH_PATTERN =
  /^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\/\d{4}$/;

export const LLM_EXTRACTION_PROMPT = `Você é um especialista em extração de dados de faturas de energia elétrica brasileiras.
Analise o documento PDF fornecido e extraia EXATAMENTE os seguintes dados da fatura em formato JSON.

Retorne APENAS um objeto JSON válido com estas propriedades (sem texto adicional):

{
  "clientNumber": "Número do cliente (campo 'Nº DO CLIENTE')",
  "referenceMonth": "Mês de referência no formato MMM/AAAA (ex: SET/2024)",
  "electricEnergyKwh": "Quantidade em kWh de 'Energia Elétrica' (número)",
  "electricEnergyValue": "Valor em R$ de 'Energia Elétrica' (número com 2 decimais)",
  "sceeEnergyKwh": "Quantidade em kWh de 'Energia SCEE s/ ICMS' ou 'En comp. s/ ICMS' (número)",
  "sceeEnergyValue": "Valor em R$ de 'Energia SCEE s/ ICMS' ou 'En comp. s/ ICMS' (número com 2 decimais)",
  "compensatedEnergyKwh": "Quantidade em kWh de 'Energia compensada GD I' (número)",
  "compensatedEnergyValue": "Valor em R$ de 'Energia compensada GD I' (número com 2 decimais, NEGATIVO pois é crédito)",
  "publicLightingValue": "Valor em R$ de 'Contrib Ilum Publica Municipal' (número com 2 decimais)"
}

REGRAS IMPORTANTES:
- Todos os valores numéricos devem ser números (não strings).
- Os valores monetários devem ter 2 casas decimais.
- O valor de 'Energia compensada GD I' em R$ é NEGATIVO (é um desconto/crédito).
- O mês de referência deve estar no formato abreviado: JAN, FEV, MAR, ABR, MAI, JUN, JUL, AGO, SET, OUT, NOV, DEZ seguido de /AAAA.
- Retorne SOMENTE o JSON, sem markdown, sem código, sem explicações.`;
