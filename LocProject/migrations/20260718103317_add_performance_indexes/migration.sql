-- CreateIndex
CREATE INDEX "agent_commissions_agent_id_idx" ON "agent_commissions"("agent_id");

-- CreateIndex
CREATE INDEX "agent_commissions_is_paid_idx" ON "agent_commissions"("is_paid");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "shipment_tracking_events_shipment_id_idx" ON "shipment_tracking_events"("shipment_id");

-- CreateIndex
CREATE INDEX "stock_items_product_variant_id_idx" ON "stock_items"("product_variant_id");
