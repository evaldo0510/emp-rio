-- Corrigir a função definindo o search_path para segurança
CREATE OR REPLACE FUNCTION public.round_commission_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.commission_rate IS NOT NULL THEN
        NEW.commission_rate := ROUND(NEW.commission_rate::numeric, 4);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
