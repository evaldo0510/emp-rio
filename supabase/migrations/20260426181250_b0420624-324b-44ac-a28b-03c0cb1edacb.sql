-- Corrigir valor padrão na tabela orders
ALTER TABLE public.orders ALTER COLUMN commission_rate SET DEFAULT 0.15;

-- Atualizar registros existentes se houver (prevencao)
UPDATE public.orders SET commission_rate = commission_rate / 100 WHERE commission_rate > 1;

-- Adicionar trigger para a tabela orders também
DROP TRIGGER IF EXISTS tr_round_order_commission ON public.orders;
CREATE TRIGGER tr_round_order_commission
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.round_commission_rate();
