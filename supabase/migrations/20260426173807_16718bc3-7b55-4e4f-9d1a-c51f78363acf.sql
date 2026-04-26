-- 1. Tabela de Perfis
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'seller', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 2. Atualizar Sellers
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0;

-- 3. Atualizar Products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
-- Usar stock_quantity como stock (já existe)

-- 4. Atualizar Shipments
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id);

-- 5. Atualizar Wallet Transactions
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS commission NUMERIC DEFAULT 0;

-- 6. Atualizar função de pagamento para registrar a comissão na transação
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

            -- Atualizar saldo
            UPDATE public.seller_wallet
            SET balance = balance + COALESCE(NEW.net_amount, 0),
                updated_at = now()
            WHERE id = v_wallet_id;

            -- Registrar transação com comissão
            INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, order_id, order_item_id, commission)
            VALUES (
                v_wallet_id,
                COALESCE(NEW.net_amount, 0),
                'sale',
                'Venda do item: ' || NEW.name || ' (Pedido #' || NEW.order_id || ')',
                NEW.order_id,
                NEW.id,
                COALESCE(NEW.commission_amount, 0)
            );
        END IF;
    END IF;
    
    -- Automação de envios: se status for 'shipped', garante que existe registro em shipments com seller_id
    IF (NEW.status = 'shipped' AND (OLD.status IS NULL OR OLD.status != 'shipped')) THEN
        INSERT INTO public.shipments (order_id, seller_id, status)
        VALUES (NEW.order_id, NEW.seller_id, 'shipped')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Sincronizar perfis iniciais
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'customer' FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Definir sellers no perfil
UPDATE public.profiles
SET role = 'seller'
WHERE id IN (SELECT user_id FROM public.sellers);

-- Definir admins no perfil
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (SELECT user_id FROM public.app_admins);
