-- 1. Garantir RLS em todas as tabelas
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Limpeza e Recriação de Políticas (Isolamento por Vendedor/Usuário)

-- Sellers: Público vê aprovados, Dono/Admin vê tudo
DROP POLICY IF EXISTS "Public can view approved sellers" ON public.sellers;
CREATE POLICY "Public can view approved sellers" ON public.sellers
  FOR SELECT USING (approved = true OR auth.uid() = user_id OR is_admin());

-- Products: Público vê se o vendedor está aprovado e produto ativo
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (
    active = true AND 
    EXISTS (SELECT 1 FROM public.sellers WHERE user_id = products.seller_id AND approved = true)
    OR (auth.uid() = seller_id OR is_admin())
  );

-- Orders: Dono e Admin veem
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- Order Items: Comprador, Vendedor do item e Admin veem
DROP POLICY IF EXISTS "Sellers view their own items" ON public.order_items;
CREATE POLICY "Sellers view their own items" ON public.order_items
  FOR SELECT USING (seller_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users view items of their orders" ON public.order_items;
CREATE POLICY "Users view items of their orders" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
    OR is_admin()
  );

-- Shipments: Comprador, Vendedor e Admin veem
DROP POLICY IF EXISTS "Users view shipments for their orders" ON public.shipments;
CREATE POLICY "Users view shipments for their orders" ON public.shipments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = shipments.order_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.order_items WHERE order_id = shipments.order_id AND seller_id = auth.uid())
    OR is_admin()
  );

-- Wallet & Transactions: Somente Vendedor e Admin veem
DROP POLICY IF EXISTS "Sellers manage own wallet" ON public.seller_wallet;
CREATE POLICY "Sellers manage own wallet" ON public.seller_wallet
  FOR SELECT USING (seller_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Sellers view own transactions" ON public.wallet_transactions;
CREATE POLICY "Sellers view own transactions" ON public.wallet_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.seller_wallet WHERE id = wallet_transactions.wallet_id AND seller_id = auth.uid())
    OR is_admin()
  );

-- 3. Automação de Cálculo de Comissões por Vendedor

-- Função para calcular comissão antes de inserir o item
CREATE OR REPLACE FUNCTION public.calculate_order_item_amounts()
RETURNS TRIGGER AS $$
DECLARE
    v_rate NUMERIC;
BEGIN
    -- Busca a taxa do vendedor ou usa 15% como padrão
    SELECT COALESCE(commission_rate, 0.15) INTO v_rate 
    FROM public.sellers 
    WHERE user_id = NEW.seller_id;
    
    IF v_rate IS NULL THEN v_rate := 0.15; END IF;

    -- Calcula valores
    NEW.commission_amount := (NEW.price * NEW.quantity) * v_rate;
    NEW.net_amount := (NEW.price * NEW.quantity) - NEW.commission_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_calculate_item_amounts ON public.order_items;
CREATE TRIGGER tr_calculate_item_amounts
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.calculate_order_item_amounts();

-- 4. Proteção contra Vendedores Não Aprovados (Bloqueio de Pedidos)
CREATE OR REPLACE FUNCTION public.block_unapproved_seller_orders()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.sellers 
        WHERE user_id = NEW.seller_id AND approved = false
    ) THEN
        RAISE EXCEPTION 'Não é possível realizar pedidos de vendedores ainda não aprovados pela plataforma.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_block_unapproved_orders ON public.order_items;
CREATE TRIGGER tr_block_unapproved_orders
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.block_unapproved_seller_orders();

-- 5. Atualizar função financeira para usar valores pré-calculados
CREATE OR REPLACE FUNCTION public.handle_order_item_paid_finance()
RETURNS TRIGGER AS $$
DECLARE
    v_wallet_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Só processa se o status mudar para 'paid'
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
        -- Evitar duplicidade
        SELECT EXISTS (
            SELECT 1 FROM public.wallet_transactions
            WHERE order_item_id = NEW.id AND type = 'sale'
        ) INTO v_exists;

        IF NOT v_exists THEN
            INSERT INTO public.seller_wallet (seller_id)
            VALUES (NEW.seller_id)
            ON CONFLICT (seller_id) DO NOTHING;

            SELECT id INTO v_wallet_id FROM public.seller_wallet WHERE seller_id = NEW.seller_id;

            UPDATE public.seller_wallet
            SET balance = balance + COALESCE(NEW.net_amount, 0),
                updated_at = now()
            WHERE id = v_wallet_id;

            INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, order_id, order_item_id, commission)
            VALUES (
                v_wallet_id,
                COALESCE(NEW.net_amount, 0),
                'sale',
                'Crédito: ' || NEW.name || ' (Pedido #' || NEW.order_id || ')',
                NEW.order_id,
                NEW.id,
                COALESCE(NEW.commission_amount, 0)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
