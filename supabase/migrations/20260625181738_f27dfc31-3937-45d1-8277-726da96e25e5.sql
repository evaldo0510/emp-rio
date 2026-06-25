INSERT INTO public.products (slug, name, category, price, rating, reviews, shop, region, image_url, short_description, description, badges, stock_quantity, active, is_published, is_draft, origin)
VALUES
  ('oleo-de-licuri-extra-virgem-200ml','Óleo de Licuri Extra Virgem 200ml','oleos-extratos',49.9,4.9,78,'Sertão Natural','Bahia','/products/oleo-de-licuri-extra-virgem-200ml.jpg','100% puro, prensado a frio.','Nosso óleo de licuri é puro e natural, extraído da polpa do licuri. Rico em antioxidantes e ácidos graxos essenciais. Ideal para alimentação, skincare e cuidados com os cabelos.',ARRAY['100% Natural','Prensado a frio','Produto do Nordeste','Não testado em animais'],50,true,true,false,'own'),
  ('farinha-de-licuri-artesanal-500g','Farinha de Licuri Artesanal 500g','alimentos',18.9,4.8,45,'Licuri da Caatinga','Bahia','/products/farinha-de-licuri-artesanal-500g.jpg','Moída na pedra, sabor delicado.','Farinha artesanal de licuri produzida por famílias da Caatinga baiana. Versátil na cozinha — vai bem em mingaus, pães e bolos.',ARRAY['Artesanal','Origem Bahia','Sem aditivos'],50,true,true,false,'own'),
  ('doce-de-licuri-tradicional','Doce de Licuri Tradicional','alimentos',25.9,4.9,32,'Sabor do Sertão','Piauí','/products/doce-de-licuri-tradicional.jpg','Receita de família, cozido em tacho.','Doce cremoso preparado em tacho de cobre, no fogo lento, com licuri e rapadura.',ARRAY['Receita tradicional','Sem conservantes'],30,true,true,false,'own'),
  ('pacoca-de-licuri','Paçoca de Licuri Artesanal','alimentos',22.9,4.7,28,'Delícias do Cerrado','Ceará','/products/pacoca-de-licuri.jpg','Crocante e levemente adocicada.','Paçoca de licuri torrada, com toque de rapadura. Acompanha bem o cafezinho.',ARRAY['Artesanal','Crocante'],40,true,true,false,'own'),
  ('licuri-desidratado-premium','Licuri Desidratado Premium 250g','alimentos',28.9,4.8,21,'Licuri da Caatinga','Bahia','/products/licuri-desidratado-premium.jpg','Crocante, ideal para snacks.','Licuri desidratado em baixa temperatura para preservar nutrientes e crocância.',ARRAY['Sem açúcar','Snack natural'],35,true,true,false,'own'),
  ('granola-de-licuri-artesanal','Granola de Licuri Artesanal 400g','alimentos',29.9,4.9,16,'Nutri Sertão','Minas Gerais','/products/granola-de-licuri-artesanal.jpg','Aveia, mel e pedaços de licuri.','Granola produzida em pequenos lotes, com aveia, mel e licuri torrado.',ARRAY['Sem glúten adicionado','Pequenos lotes'],25,true,true,false,'own'),
  ('manteiga-corporal-de-licuri','Manteiga Corporal de Licuri 100g','cosmeticos',64.9,4.9,54,'Sertão Natural','Bahia','/products/manteiga-corporal-de-licuri.jpg','Hidratação intensa para pele e cabelo.','Manteiga rica em vitamina E. Hidrata profundamente e protege a barreira cutânea.',ARRAY['Vegano','Cruelty-free','Pequenos produtores'],40,true,true,false,'own'),
  ('cesto-artesanal-palha-de-licuri','Cesto Artesanal Palha de Licuri','artesanato',89.9,5,12,'Mãos da Caatinga','Bahia','/products/cesto-artesanal-palha-de-licuri.jpg','Tecido à mão por artesãs da região.','Peça única, tecida em palha de licuri por mestras artesãs nordestinas.',ARRAY['Feito à mão','Peça única','Comércio justo'],8,true,true,false,'own'),
  ('kit-presente-raizes-do-nordeste','Kit Presente Raízes do Nordeste','kits-presentes',159.9,4.9,9,'Licuri Hub','Bahia','/products/kit-presente-raizes-do-nordeste.jpg','Óleo, doce e paçoca em embalagem especial.','Kit com óleo de licuri 100ml, doce tradicional e paçoca artesanal. Ideal para presentear.',ARRAY['Edição especial','Embalagem sustentável'],15,true,true,false,'own')
ON CONFLICT (slug) DO NOTHING;

-- Garante que anon possa LER produtos publicados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND policyname='Public can read active products'
  ) THEN
    CREATE POLICY "Public can read active products"
      ON public.products FOR SELECT TO anon, authenticated
      USING (active = true AND is_draft = false);
  END IF;
END $$;

GRANT SELECT ON public.products TO anon;