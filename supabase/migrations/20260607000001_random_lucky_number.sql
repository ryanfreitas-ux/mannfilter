-- Delta migration: switch lucky number from sequential to random unique
-- Run this on instances where migration 000000 was already applied

-- Drop the old sequence (no longer needed)
DROP SEQUENCE IF EXISTS public.numero_sorte_seq;

-- Add unique constraint on numero_da_sorte if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'participacoes_numero_sorte_unique'
      AND conrelid = 'public.participacoes'::regclass
  ) THEN
    ALTER TABLE public.participacoes
      ADD CONSTRAINT participacoes_numero_sorte_unique UNIQUE (numero_da_sorte);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS participacoes_numero_sorte_idx ON public.participacoes (numero_da_sorte);

-- Replace function with random unique number generation
CREATE OR REPLACE FUNCTION public.registrar_participacao(
  p_nome TEXT,
  p_cpf TEXT,
  p_whatsapp TEXT,
  p_email TEXT,
  p_data_compra DATE,
  p_canal TEXT,
  p_numero_nf TEXT,
  p_arquivo_nf_url TEXT DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_numero_sorte TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM participacoes WHERE cpf = p_cpf) THEN
    RAISE EXCEPTION 'CPF_DUPLICADO';
  END IF;

  LOOP
    v_numero_sorte := LPAD(floor(random() * 1000000)::INT::TEXT, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM participacoes WHERE numero_da_sorte = v_numero_sorte);
  END LOOP;

  INSERT INTO participacoes (
    nome, cpf, whatsapp, email, data_compra,
    canal, numero_nf, arquivo_nf_url, numero_da_sorte
  ) VALUES (
    p_nome, p_cpf, p_whatsapp, p_email, p_data_compra,
    p_canal, p_numero_nf, p_arquivo_nf_url, v_numero_sorte
  );

  RETURN v_numero_sorte;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_participacao TO anon, authenticated;
