-- Table for promotion participants
CREATE TABLE IF NOT EXISTS public.participacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  data_compra DATE NOT NULL,
  canal TEXT NOT NULL,
  numero_nf TEXT NOT NULL,
  arquivo_nf_url TEXT,
  numero_da_sorte TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.participacoes
  ADD CONSTRAINT participacoes_cpf_unique UNIQUE (cpf);

CREATE INDEX IF NOT EXISTS participacoes_cpf_idx ON public.participacoes (cpf);

-- Sequential counter for lucky numbers
CREATE SEQUENCE IF NOT EXISTS public.numero_sorte_seq START 1;

-- RLS (no direct anon access; all writes go through the SECURITY DEFINER function)
ALTER TABLE public.participacoes ENABLE ROW LEVEL SECURITY;

-- Storage bucket for NF files (public so URLs work client-side)
INSERT INTO storage.buckets (id, name, public)
VALUES ('notas-fiscais', 'notas-fiscais', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anon_upload_nf" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'notas-fiscais');

-- Atomically checks CPF, generates lucky number, and inserts record
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

  v_numero_sorte := LPAD(nextval('numero_sorte_seq')::TEXT, 6, '0');

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
