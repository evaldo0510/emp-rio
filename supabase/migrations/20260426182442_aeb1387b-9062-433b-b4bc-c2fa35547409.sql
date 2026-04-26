-- Atualizar a função protect_seller_approval para proteger mais colunas
CREATE OR REPLACE FUNCTION public.protect_seller_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o usuário não for admin, ele não pode alterar colunas críticas
    IF NOT public.is_admin() THEN
        IF TG_OP = 'INSERT' THEN
            NEW.approved := false;
            NEW.verified_at := NULL;
            NEW.rating := 0;
            -- commission_rate tem default ou é definido pelo sistema
        ELSIF TG_OP = 'UPDATE' THEN
            -- Protege approved
            IF (NEW.approved IS DISTINCT FROM OLD.approved) THEN
                NEW.approved := OLD.approved;
            END IF;
            -- Protege verified_at
            IF (NEW.verified_at IS DISTINCT FROM OLD.verified_at) THEN
                NEW.verified_at := OLD.verified_at;
            END IF;
            -- Protege rating
            IF (NEW.rating IS DISTINCT FROM OLD.rating) THEN
                NEW.rating := OLD.rating;
            END IF;
            -- Protege commission_rate
            IF (NEW.commission_rate IS DISTINCT FROM OLD.commission_rate) THEN
                NEW.commission_rate := OLD.commission_rate;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
