-- 1. Unificar lógica de crédito na carteira
DROP TRIGGER IF EXISTS tr_order_item_commission ON order_items;
DROP FUNCTION IF EXISTS handle_order_item_commission();

-- Adicionar order_item_id à tabela wallet_transactions para melhor rastreamento
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS order_item_id UUID REFERENCES public.order_items(id);

-- Adicionar índice de unicidade para evitar duplicidade de crédito por item
-- Se já existir algum dado duplicado, isso pode falhar, mas em um sistema novo é o ideal.
-- Usaremos uma lógica no trigger para verificar antes de inserir, mas o índice é uma segurança extra.
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_transactions_order_item ON public.wallet_transactions (order_item_id) WHERE order_item_id IS NOT NULL;

-- 2. Atualizar função de pagamento de pedido
CREATE OR REPLACE FUNCTION public.handle_order_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    item RECORD;
    v_wallet_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Só processa se o status mudar para 'paid'
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) OR 
       (NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid')) THEN
        
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            -- Verificar se já existe transação para este item
            SELECT EXISTS (
                SELECT 1 FROM public.wallet_transactions 
                WHERE order_item_id = item.id AND type = 'sale'
            ) INTO v_exists;

            IF NOT v_exists THEN
                -- Garantir que a carteira existe
                INSERT INTO public.seller_wallet (seller_id)
                VALUES (item.seller_id)
                ON CONFLICT (seller_id) DO NOTHING;

                SELECT id INTO v_wallet_id FROM public.seller_wallet WHERE seller_id = item.seller_id;

                -- Atualizar saldo
                UPDATE public.seller_wallet
                SET balance = balance + item.net_amount,
                    updated_at = now()
                WHERE id = v_wallet_id;

                -- Registrar transação
                INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, order_id, order_item_id)
                VALUES (
                    v_wallet_id, 
                    item.net_amount, 
                    'sale', 
                    'Venda do item: ' || item.name || ' (Pedido #' || NEW.id || ')', 
                    NEW.id, 
                    item.id
                );
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;

-- 3. Endurecimento do RLS para Administradores
-- Função auxiliar para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.app_admins
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar políticas para incluir admins
-- Tabela: orders
DROP POLICY IF EXISTS "Admins manage all orders" ON public.orders;
CREATE POLICY "Admins manage all orders" ON public.orders
    FOR ALL USING (public.is_admin());

-- Tabela: order_items
DROP POLICY IF EXISTS "Admins manage all order items" ON public.order_items;
CREATE POLICY "Admins manage all order items" ON public.order_items
    FOR ALL USING (public.is_admin());

-- Tabela: sellers
DROP POLICY IF EXISTS "Admins manage all sellers" ON public.sellers;
CREATE POLICY "Admins manage all sellers" ON public.sellers
    FOR ALL USING (public.is_admin());

-- Tabela: products
DROP POLICY IF EXISTS "Admins manage all products" ON public.products;
CREATE POLICY "Admins manage all products" ON public.products
    FOR ALL USING (public.is_admin());

-- Tabela: seller_wallet
DROP POLICY IF EXISTS "Admins manage all wallets" ON public.seller_wallet;
CREATE POLICY "Admins manage all wallets" ON public.seller_wallet
    FOR ALL USING (public.is_admin());

-- Tabela: wallet_transactions
DROP POLICY IF EXISTS "Admins manage all transactions" ON public.wallet_transactions;
CREATE POLICY "Admins manage all transactions" ON public.wallet_transactions
    FOR ALL USING (public.is_admin());

-- Tabela: withdrawal_requests
DROP POLICY IF EXISTS "Admins manage all withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Admins manage all withdrawal requests" ON public.withdrawal_requests
    FOR ALL USING (public.is_admin());

-- Tabela: shipments
DROP POLICY IF EXISTS "Admins manage all shipments" ON public.shipments;
CREATE POLICY "Admins manage all shipments" ON public.shipments
    FOR ALL USING (public.is_admin());
