# Plano de Implementação - Cadastro de Produtos e Fluxo do Produtor

Este plano detalha as etapas para implementar o cadastro completo de produtos no Painel do Produtor e validar o fluxo de inscrição via mobile.

## Mudanças do Usuário

### Funcionalidades do Painel

- **Cadastro de Produtos**: Implementar formulário completo com campos para fotos, categoria, preço, estoque e status.
- **Persistência**: Garantir que os dados sejam salvos corretamente no banco de dados (Supabase).

### Validação de Fluxo (Mobile)

- **Fluxo Completo**: Testar e garantir que o processo de inscrição (cadastro de loja), login e primeiro cadastro de produto funcione sem interrupções em dispositivos móveis.
- **Recuperação de Dados**: Fortalecer o `localStorage` para evitar perda de dados em formulários longos no mobile.

## Detalhes Técnicos

### Backend (Supabase)

- Utilizar a tabela `products` existente.
- Verificar se as políticas de RLS permitem que o `seller_id` (vinculado ao `auth.uid()`) insira e atualize seus próprios produtos.
- Garantir que o upload de imagens para o bucket `product-images` esteja funcional.

### Frontend (React/TanStack)

- **Componente `VendorDashboard` (`src/routes/_app.vendedor.tsx`)**:
  - Expandir o estado `newProduct` para incluir todos os campos solicitados.
  - Melhorar o componente de upload de imagem para suportar visualização prévia.
  - Implementar lógica de "Status" (Ativo/Inativo/Rascunho).
- **UX Mobile**:
  - Ajustar o layout do diálogo de cadastro para ser totalmente responsivo (uso de `Drawer` em telas pequenas se necessário, ou garantir que o scroll funcione bem).
  - Adicionar feedback visual claro durante o salvamento.

---

Irei iniciar a implementação do formulário de produtos agora.
