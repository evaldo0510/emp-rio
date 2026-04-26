-- Trigger to process withdrawal approval
CREATE OR REPLACE FUNCTION public.process_withdrawal_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  wallet_record RECORD;
BEGIN
  -- Only act if status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    -- Get the seller's wallet
    SELECT * INTO wallet_record FROM public.seller_wallet WHERE seller_id = NEW.seller_id;
    
    IF wallet_record.id IS NOT NULL THEN
      -- Check if balance is sufficient (double check)
      IF wallet_record.balance >= NEW.amount THEN
        -- Deduct from balance and increase total_withdrawn
        UPDATE public.seller_wallet 
        SET 
          balance = balance - NEW.amount, 
          total_withdrawn = total_withdrawn + NEW.amount,
          updated_at = now() 
        WHERE id = wallet_record.id;
        
        -- Create a wallet transaction record
        INSERT INTO public.wallet_transactions (wallet_id, amount, type, description)
        VALUES (wallet_record.id, -NEW.amount, 'withdrawal', 'Saque aprovado (PIX: ' || NEW.pix_key || ')');
      ELSE
        -- This should normally be handled by application logic, but as a safety:
        RAISE EXCEPTION 'Saldo insuficiente para aprovar este saque.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_withdrawal_approved
AFTER UPDATE OF status ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.process_withdrawal_approval();
