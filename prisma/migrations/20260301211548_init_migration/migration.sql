-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "client_number" TEXT NOT NULL,
    "reference_month" TEXT NOT NULL,
    "electric_energy_kwh" DOUBLE PRECISION NOT NULL,
    "electric_energy_value" DOUBLE PRECISION NOT NULL,
    "scee_energy_kwh" DOUBLE PRECISION NOT NULL,
    "scee_energy_value" DOUBLE PRECISION NOT NULL,
    "compensated_energy_kwh" DOUBLE PRECISION NOT NULL,
    "compensated_energy_value" DOUBLE PRECISION NOT NULL,
    "public_lighting_value" DOUBLE PRECISION NOT NULL,
    "total_energy_consumption_kwh" DOUBLE PRECISION NOT NULL,
    "total_value_without_gd" DOUBLE PRECISION NOT NULL,
    "gd_economy_value" DOUBLE PRECISION NOT NULL,
    "pdf_url" TEXT,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoices_client_number_idx" ON "invoices"("client_number");

-- CreateIndex
CREATE INDEX "invoices_reference_month_idx" ON "invoices"("reference_month");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_client_number_reference_month_key" ON "invoices"("client_number", "reference_month");
