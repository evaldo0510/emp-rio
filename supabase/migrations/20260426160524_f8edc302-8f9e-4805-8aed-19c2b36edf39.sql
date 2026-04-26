-- Create shipment_updates table
CREATE TABLE IF NOT EXISTS public.shipment_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  description TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipment_updates ENABLE ROW LEVEL SECURITY;

-- Policies for shipment_updates
CREATE POLICY "Users view updates for their orders" ON public.shipment_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shipments
      JOIN public.orders ON shipments.order_id = orders.id
      WHERE shipments.id = shipment_updates.shipment_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Sellers manage updates for their shipments" ON public.shipment_updates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.shipments
      JOIN public.order_items ON shipments.order_id = order_items.order_id
      WHERE shipments.id = shipment_updates.shipment_id
      AND order_items.seller_id = auth.uid()
    )
  );

-- Function to automatically add history update when shipment status changes
CREATE OR REPLACE FUNCTION public.handle_shipment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.shipment_updates (shipment_id, status, description)
    VALUES (NEW.id, NEW.status, 
      CASE 
        WHEN NEW.status = 'processing' THEN 'Pedido sendo processado pelo vendedor'
        WHEN NEW.status = 'shipped' THEN 'Pedido enviado e em trânsito'
        WHEN NEW.status = 'delivered' THEN 'Pedido entregue ao destinatário'
        ELSE 'Status atualizado para ' || NEW.status
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for shipment status history
CREATE TRIGGER on_shipment_status_change
AFTER INSERT OR UPDATE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.handle_shipment_status_change();
