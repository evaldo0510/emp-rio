-- 1. Atualizar a taxa de comissão padrão na tabela de vendedores para 15% (0.15)
ALTER TABLE public.sellers ALTER COLUMN commission_rate SET DEFAULT 0.15;
UPDATE public.sellers SET commission_rate = 0.15 WHERE commission_rate IS NULL OR commission_rate != 0.15;

-- 2. Atualizar a função de processamento de comissões para garantir o cálculo de 15%
-- Esta função é disparada quando o status do pedido principal muda para 'paid'
CREATE OR REPLACE FUNCTION public.process_order_commissions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 DECLARE
   item RECORD;
   wallet_id_var UUID;
   v_commission_rate NUMERIC := 0.15; -- 15% fixo para a plataforma
   v_net_amount NUMERIC;
 BEGIN
   IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
     FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
       IF item.seller_id IS NOT NULL THEN
         -- Garantir que a carteira existe
         INSERT INTO public.seller_wallet (seller_id) VALUES (item.seller_id) ON CONFLICT (seller_id) DO NOTHING;
         SELECT id INTO wallet_id_var FROM public.seller_wallet WHERE seller_id = item.seller_id;
         
         -- Cálculo: Vendedor recebe 85% (1 - 0.15)
         v_net_amount := (item.price * item.quantity) * (1 - v_commission_rate);
         
         -- Atualizar saldo
         UPDATE public.seller_wallet 
         SET balance = balance + v_net_amount, 
             updated_at = now() 
         WHERE id = wallet_id_var;
         
         -- Registrar transação
         INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, order_id, commission)
         VALUES (wallet_id_var, v_net_amount, 'sale', 'Venda: ' || item.name, NEW.id, (item.price * item.quantity) * v_commission_rate);
       END IF;
     END LOOP;
     -- Criar registro de envio inicial
     INSERT INTO public.shipments (order_id, status) VALUES (NEW.id, 'processing') ON CONFLICT DO NOTHING;
   END IF;
   RETURN NEW;
 END;
 $function$;

-- 3. Atualizar a função handle_order_item_paid_finance para refletir os 15%
-- Esta função é disparada quando um item individual é marcado como 'paid'
CREATE OR REPLACE FUNCTION public.handle_order_item_paid_finance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_wallet_id UUID;
    v_exists BOOLEAN;
    v_commission_rate NUMERIC := 0.15; -- 15% fixo para a plataforma
    v_total_amount NUMERIC;
    v_net_amount_calc NUMERIC;
    v_commission_amount_calc NUMERIC;
BEGIN
    -- Só processa se o status mudar para 'paid'
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
        -- Verificar se já existe transação para este item para evitar duplicidade
        SELECT EXISTS (
            SELECT 1 FROM public.wallet_transactions
            WHERE order_item_id = NEW.id AND type = 'sale'
        ) INTO v_exists;

        IF NOT v_exists THEN
            -- Garantir que a carteira do vendedor existe
            INSERT INTO public.seller_wallet (seller_id)
            VALUES (NEW.seller_id)
            ON CONFLICT (seller_id) DO NOTHING;

            SELECT id INTO v_wallet_id FROM public.seller_wallet WHERE seller_id = NEW.seller_id;

            -- Recalcular valores para garantir a regra de 15%/85%
            v_total_amount := NEW.price * NEW.quantity;
            v_commission_amount_calc := v_total_amount * v_commission_rate;
            v_net_amount_calc := v_total_amount - v_commission_amount_calc;

            -- Atualizar saldo
            UPDATE public.seller_wallet
            SET balance = balance + v_net_amount_calc,
                updated_at = now()
            WHERE id = v_wallet_id;

            -- Registrar transação com comissão de 15%
            INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, order_id, order_item_id, commission)
            VALUES (
                v_wallet_id,
                v_net_amount_calc,
                'sale',
                'Venda do item: ' || NEW.name || ' (Pedido #' || NEW.order_id || ')',
                NEW.order_id,
                NEW.id,
                v_commission_amount_calc
            );
            
            -- Sincronizar os valores de volta no item para consistência no dashboard
            UPDATE public.order_items 
            SET commission_amount = v_commission_amount_calc,
                net_amount = v_net_amount_calc
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    -- Automação de envios
    IF (NEW.status = 'shipped' AND (OLD.status IS NULL OR OLD.status != 'shipped')) THEN
        INSERT INTO public.shipments (order_id, seller_id, status)
        VALUES (NEW.order_id, NEW.seller_id, 'shipped')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$function$;
