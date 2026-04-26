-- Função para processar o crédito do vendedor quando um item individual é pago
CREATE OR REPLACE FUNCTION public.handle_order_item_paid_finance()
RETURNS TRIGGER AS $$
DECLARE
    v_wallet_id UUID;
    v_exists BOOLEAN;
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

            -- Atualizar saldo (net_amount já deve estar calculado no item)
            UPDATE public.seller_wallet
            SET balance = balance + COALESCE(NEW.net_amount, 0),
                updated_at = now()
            WHERE id = v_wallet_id;

            -- Registrar transação
            INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, order_id, order_item_id)
            VALUES (
                v_wallet_id,
                COALESCE(NEW.net_amount, 0),
                'sale',
                'Venda do item: ' || NEW.name || ' (Pedido #' || NEW.order_id || ')',
                NEW.order_id,
                NEW.id
            );
        END IF;
    END IF;
    
    -- Automação de envios: se status for 'shipped', garante que existe registro em shipments
    IF (NEW.status = 'shipped' AND (OLD.status IS NULL OR OLD.status != 'shipped')) THEN
        INSERT INTO public.shipments (order_id, status)
        VALUES (NEW.order_id, 'shipped')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar gatilho na tabela order_items
DROP TRIGGER IF EXISTS tr_order_item_finance ON public.order_items;
CREATE TRIGGER tr_order_item_finance
AFTER UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_item_paid_finance();

-- Garantir que todos os itens são marcados como pagos quando o pedido principal é pago
-- (Isso disparará o gatilho acima individualmente para cada item)
CREATE OR REPLACE FUNCTION public.sync_order_items_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) OR
       (NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid')) THEN
       
       UPDATE public.order_items
       SET status = 'paid'
       WHERE order_id = NEW.id AND (status IS NULL OR status != 'paid');
       
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_order_items_payment ON public.orders;
CREATE TRIGGER tr_sync_order_items_payment
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_order_items_on_payment();
