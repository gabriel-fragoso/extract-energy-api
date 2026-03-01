# API de Processamento de Faturas de Energia

Recebe faturas de energia elétrica em PDF, extrai dados estruturados via LLM (Claude da Anthropic) e disponibiliza endpoints para consulta e dashboard.

---

## Decisões Arquiteturais

| Decisão        | Escolha                                  | Motivo                                                                                                 |
| -------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Framework      | **NestJS**                               | Arquitetura modular, IoC nativo, facilita testes unitários com mocks                                   |
| ORM            | **Prisma**                               | Type-safety end-to-end, migrations automáticas, queries compostas ergonômicas                          |
| Banco de Dados | **PostgreSQL**                           | Suporte a índices compostos, eficiente para filtros e agregações                                       |
| LLM            | **Anthropic Claude** (`claude-opus-4-5`) | Suporte nativo a documentos PDF via API Messages, JSON estruturado confiável, baixa taxa de alucinação |
| Upload         | **Multer** (memoryStorage)               | Mantém o PDF em memória para envio direto ao LLM sem I/O de disco                                      |

---

## Estrutura do Projeto

```
src/
├── app.module.ts
├── main.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── invoices/
    ├── dto/
    │   └── filter-invoices.dto.ts
    ├── interfaces/
    │   ├── dashboard.interface.ts
    │   └── llm-extraction-result.interface.ts
    ├── invoices.controller.ts
    ├── invoices.controller.spec.ts
    ├── invoices.module.ts
    ├── invoices.service.ts
    ├── invoices.service.spec.ts
    ├── llm.service.ts
    └── llm.service.spec.ts
```

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

| Variável            | Obrigatória | Descrição                                 |
| ------------------- | ----------- | ----------------------------------------- |
| `DATABASE_URL`      | ✅          | Connection string do PostgreSQL           |
| `ANTHROPIC_API_KEY` | ✅          | Chave de API da Anthropic                 |
| `ANTHROPIC_MODEL`   | ❌          | Modelo Claude (padrão: `claude-opus-4-5`) |
| `PORT`              | ❌          | Porta da aplicação (padrão: `3000`)       |

---

## Instalação e Execução

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

### 1. Instalar dependências

```bash
npm install
```

### 2. Subir o banco de dados

```bash
docker compose up -d
```

### 3. Rodar as migrations

```bash
npx prisma migrate dev --name init
```

### 4. Iniciar a aplicação

```bash
# desenvolvimento
npm run start:dev

# produção
npm run build && npm run start:prod
```

---

## Testes

```bash
# unitários
npm run test

# com cobertura
npm run test:cov
```

Os testes mockam completamente o `LlmService` (sem chamadas reais à API da Anthropic) e o `PrismaService` (sem banco real), validando isoladamente:

- Cálculo das variáveis derivadas
- Fluxo de upload (arquivo inválido, falha do LLM, sucesso)
- Endpoints de listagem e dashboard
- Validação do JSON retornado pelo LLM

---

## Endpoints da API

### `POST /invoices/upload`

Recebe um PDF de fatura, extrai dados via LLM e persiste no banco.

```bash
curl -X POST http://localhost:3000/invoices/upload \
  -F "file=@fatura.pdf"
```

**Resposta `201`:**

```json
{
  "id": "uuid",
  "clientNumber": "7202210726",
  "referenceMonth": "SET/2024",
  "electricEnergyKwh": 50,
  "electricEnergyValue": 40.0,
  "sceeEnergyKwh": 476,
  "sceeEnergyValue": 200.0,
  "compensatedEnergyKwh": 476,
  "compensatedEnergyValue": -200.0,
  "publicLightingValue": 30.0,
  "totalEnergyConsumptionKwh": 526,
  "totalValueWithoutGd": 270.0,
  "gdEconomyValue": 200.0,
  "createdAt": "2026-02-28T00:00:00.000Z",
  "updatedAt": "2026-02-28T00:00:00.000Z"
}
```

---

### `GET /invoices`

Lista faturas processadas com filtros opcionais.

```bash
# todas
curl http://localhost:3000/invoices

# por cliente
curl "http://localhost:3000/invoices?clientNumber=7202210726"

# por mês
curl "http://localhost:3000/invoices?referenceMonth=SET/2024"

# combinado
curl "http://localhost:3000/invoices?clientNumber=7202210726&referenceMonth=SET/2024"
```

---

### `GET /invoices/dashboard/energy`

Retorna consumo vs energia compensada por mês.

```bash
curl http://localhost:3000/invoices/dashboard/energy

# com filtro de cliente
curl "http://localhost:3000/invoices/dashboard/energy?clientNumber=7202210726"
```

**Resposta `200`:**

```json
[
  {
    "month": "SET/2024",
    "totalEnergyConsumptionKwh": 526,
    "compensatedEnergyKwh": 476
  }
]
```

---

### `GET /invoices/dashboard/financial`

Retorna valor total sem GD vs economia GD por mês.

```bash
curl http://localhost:3000/invoices/dashboard/financial

# com filtro de cliente
curl "http://localhost:3000/invoices/dashboard/financial?clientNumber=7202210726"
```

**Resposta `200`:**

```json
[
  {
    "month": "SET/2024",
    "totalValueWithoutGd": 270.0,
    "gdEconomyValue": 200.0
  }
]
```

---

## Lógica de Cálculo

Após a extração pelo LLM, o backend calcula:

| Campo                       | Fórmula                                                       |
| --------------------------- | ------------------------------------------------------------- |
| `totalEnergyConsumptionKwh` | `electricEnergyKwh + sceeEnergyKwh`                           |
| `totalValueWithoutGd`       | `electricEnergyValue + sceeEnergyValue + publicLightingValue` |
| `gdEconomyValue`            | `Math.abs(compensatedEnergyValue)`                            |

Caso a combinação `(clientNumber, referenceMonth)` já exista no banco, o registro é atualizado (upsert).
