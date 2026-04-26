-- 1. Criar tabela de configurações por tipo de vendedor
CREATE TABLE IF NOT EXISTS public.seller_type_settings (
    seller_type TEXT PRIMARY KEY,
    commission_rate NUMERIC NOT NULL DEFAULT 0.15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_type_settings ENABLE ROW LEVEL SECURITY;

-- Policies for seller_type_settings (Admins can manage, everyone can read)
CREATE POLICY "Everyone can read seller type settings" ON public.seller_type_settings FOR SELECT USING (true);

-- 2. Inserir tipos padrão (Lojas, Associações, Cooperativas)
INSERT INTO public.seller_type_settings (seller_type, commission_rate)
VALUES 
    ('Loja', 0.15),
    ('Associação', 0.12),
    ('Cooperativa', 0.10)
ON CONFLICT (seller_type) DO NOTHING;

-- 3. Atualizar a função de processamento de comissões para ser dinâmica
CREATE OR REPLACE FUNCTION public.process_order_commissions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 DECLARE
   item RECORD;
   wallet_id_var UUID;
   v_commission_rate NUMERIC;
   v_net_amount NUMERIC;
   v_seller_record RECORD;
 BEGIN
   IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
     FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
       IF item.seller_id IS NOT NULL THEN
         -- Buscar informações do vendedor
         SELECT commission_rate, seller_type INTO v_seller_record 
         FROM public.sellers 
         WHERE id = item.seller_id;

         -- Lógica de precedência para a taxa de comissão:
         -- 1. Taxa individual do vendedor (se definida na tabela sellers)
         -- 2. Taxa do tipo de vendedor (se definida na tabela seller_type_settings)
         -- 3. Default 0.15
         
         v_commission_rate := v_seller_record.commission_rate;

         IF v_commission_rate IS NULL THEN
            SELECT commission_rate INTO v_commission_rate 
            FROM public.seller_type_settings 
            WHERE seller_type = v_seller_record.seller_type;
         END IF;

         IF v_commission_rate IS NULL THEN
            v_commission_rate := 0.15;
         END IF;

         -- Garantir que a carteira existe
         INSERT INTO public.seller_wallet (seller_id) VALUES (item.seller_id) ON CONFLICT (seller_id) DO NOTHING;
         SELECT id INTO wallet_id_var FROM public.seller_wallet WHERE seller_id = item.seller_id;
         
         -- Cálculo: Valor líquido = Total do item * (1 - comissão)
         v_net_amount := (item.price * item.quantity) * (1 - v_commission_rate);
         
         -- Atualizar saldo
         UPDATE public.seller_wallet 
         SET balance = balance + v_net_amount, 
             updated_at = now() 
         WHERE id = wallet_id_var;
         
         -- Registrar transação
         INSERT INTO public.wallet_transactions (wallet_id, seller_id, order_id, amount, commission, type, description)
         VALUES (
           wallet_id_var, 
           item.seller_id, 
           NEW.id, 
           v_net_amount, 
           (item.price * item.quantity) * v_commission_rate,
           'sale', 
           'Venda do item: ' || COALESCE(item.name, 'Produto')
         );
       END IF;
     END LOOP;
     
     -- Atualizar status de envio para os vendedores envolvidos
     INSERT INTO public.shipments (order_id, seller_id, status)
     SELECT DISTINCT NEW.id, seller_id, 'pending'
     FROM public.order_items
     WHERE order_id = NEW.id AND seller_id IS NOT NULL
     ON CONFLICT DO NOTHING;
     
   END IF;
   RETURN NEW;
 END;
$function$;
