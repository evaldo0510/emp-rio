-- Função para arredondar a comissão para 4 casas decimais (ex: 0.1525 para 15.25%)
CREATE OR REPLACE FUNCTION public.round_commission_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.commission_rate IS NOT NULL THEN
        NEW.commission_rate := ROUND(NEW.commission_rate::numeric, 4);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para seller_type_settings
DROP TRIGGER IF EXISTS tr_round_seller_type_commission ON public.seller_type_settings;
CREATE TRIGGER tr_round_seller_type_commission
BEFORE INSERT OR UPDATE ON public.seller_type_settings
FOR EACH ROW
EXECUTE FUNCTION public.round_commission_rate();

-- Trigger para sellers
DROP TRIGGER IF EXISTS tr_round_seller_commission ON public.sellers;
CREATE TRIGGER tr_round_seller_commission
BEFORE INSERT OR UPDATE ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION public.round_commission_rate();
