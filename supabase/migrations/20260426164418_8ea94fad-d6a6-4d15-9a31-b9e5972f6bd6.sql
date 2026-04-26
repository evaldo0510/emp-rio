-- Function to handle withdrawal approval
CREATE OR REPLACE FUNCTION public.handle_withdrawal_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    -- When a withdrawal is marked as 'approved'
    IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')) THEN
        SELECT id INTO v_wallet_id FROM public.seller_wallet WHERE seller_id = NEW.seller_id;
        
        IF v_wallet_id IS NOT NULL THEN
            -- Update wallet balance and total withdrawn
            UPDATE public.seller_wallet 
            SET balance = balance - NEW.amount,
                total_withdrawn = total_withdrawn + NEW.amount,
                updated_at = now()
            WHERE id = v_wallet_id;
            
            -- Record transaction
            INSERT INTO public.wallet_transactions (wallet_id, amount, type, description)
            VALUES (v_wallet_id, -NEW.amount, 'withdrawal', 'Saque aprovado (Solicitação #' || NEW.id || ')');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS on_withdrawal_approved ON public.withdrawal_requests;
CREATE TRIGGER on_withdrawal_approved
    AFTER UPDATE ON public.withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_withdrawal_approval();
