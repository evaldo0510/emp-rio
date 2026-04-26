-- Adicionar colunas para facilitar a leitura se necessário, mas primeiro garantir que os nomes sejam claros
-- Vou renomear se necessário ou apenas garantir que os valores inseridos sejam os corretos.

-- Adicionar colunas para valores percentuais (ex: 15.00) além dos normalizados (ex: 0.15)
ALTER TABLE public.commission_rate_history 
ADD COLUMN IF NOT EXISTS old_rate_percent NUMERIC,
ADD COLUMN IF NOT EXISTS new_rate_percent NUMERIC;

-- Atualizar a função de log para preencher todos os campos
CREATE OR REPLACE FUNCTION public.log_commission_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.commission_rate IS DISTINCT FROM NEW.commission_rate) THEN
        INSERT INTO public.commission_rate_history (
            seller_type, 
            old_rate, 
            new_rate, 
            old_rate_percent, 
            new_rate_percent, 
            admin_id
        )
        VALUES (
            OLD.seller_type, 
            OLD.commission_rate, 
            NEW.commission_rate, 
            OLD.commission_rate * 100, 
            NEW.commission_rate * 100, 
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
