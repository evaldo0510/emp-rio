-- Improve the seller protection trigger to handle INSERTs as well
CREATE OR REPLACE FUNCTION public.protect_seller_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- If the user is not an admin, they cannot change the 'approved' or 'verified_at' columns
    IF NOT public.is_admin() THEN
        IF TG_OP = 'INSERT' THEN
            NEW.approved := false;
            NEW.verified_at := NULL;
        ELSIF TG_OP = 'UPDATE' THEN
            IF (NEW.approved IS DISTINCT FROM OLD.approved) OR (NEW.verified_at IS DISTINCT FROM OLD.verified_at) THEN
                NEW.approved := OLD.approved;
                NEW.verified_at := OLD.verified_at;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger runs on both INSERT and UPDATE
DROP TRIGGER IF EXISTS tr_protect_seller_approval ON public.sellers;
CREATE TRIGGER tr_protect_seller_approval
BEFORE INSERT OR UPDATE ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION public.protect_seller_approval();

-- Tighten RLS policies for sellers
DROP POLICY IF EXISTS "Sellers can insert own profile" ON public.sellers;
CREATE POLICY "Sellers can insert own profile" 
ON public.sellers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND approved = false AND verified_at IS NULL);

CREATE POLICY "Admins can update all sellers" 
ON public.sellers 
FOR UPDATE 
USING (public.is_admin());

-- Tighten RLS policies for withdrawal_requests
DROP POLICY IF EXISTS "Sellers can create their own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Sellers can create their own withdrawal requests" 
ON public.withdrawal_requests 
FOR INSERT 
WITH CHECK (auth.uid() = seller_id AND status = 'pending');

CREATE POLICY "Admins can update all withdrawal requests" 
ON public.withdrawal_requests 
FOR UPDATE 
USING (public.is_admin());

-- Update the withdrawal processing trigger to ONLY run on updates (approvals)
-- and never on initial insert, as a second layer of defense
CREATE OR REPLACE FUNCTION public.process_withdrawal_approval()
RETURNS TRIGGER AS $$
DECLARE
  wallet_record RECORD;
BEGIN
  -- Only act if status changed to 'approved' and it's an UPDATE
  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
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
        RAISE EXCEPTION 'Saldo insuficiente para aprovar este saque.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure withdrawal trigger only runs on UPDATE
DROP TRIGGER IF EXISTS tr_process_withdrawal_approval ON public.withdrawal_requests;
CREATE TRIGGER tr_process_withdrawal_approval
AFTER UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.process_withdrawal_approval();

-- Admin management policies
CREATE POLICY "Admins can insert admins" 
ON public.app_admins 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete admins" 
ON public.app_admins 
FOR DELETE 
USING (public.is_admin());
