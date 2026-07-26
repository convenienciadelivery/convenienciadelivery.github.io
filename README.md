# Cardápio Digital + Delivery de Bebidas

Aplicação web estática (HTML/CSS/JS) pronta para produção — cardápio digital com pedidos via WhatsApp, PWA instalável e painel administrativo.

Ideal para adegas, bars e distribuidoras de bebidas.

## Demonstração local

Como o app carrega arquivos JSON via `fetch`, é necessário um servidor HTTP simples (não abra o `index.html` direto no navegador).

### Opção 1 — Python

```bash
cd cardapio-digital-bebidas
python -m http.server 5500
```

Acesse: http://localhost:5500

### Opção 2 — VS Code / Cursor

Extensão **Live Server** → Open with Live Server.

### Opção 3 — Node

```bash
npx serve .
```

## Publicar no GitHub Pages

### Passo a passo (recomendado)

1. Crie um repositório no GitHub e envie esta pasta (branch `main` ou `master`).
2. Em **Settings → Pages**:
   - **Source**: `GitHub Actions`
3. O workflow `.github/workflows/deploy-pages.yml` publica automaticamente a cada push.
4. Aguarde o Action ficar verde e abra a URL (ex: `https://SEU-USUARIO.github.io/NOME-DO-REPO/`).

### Alternativa (branch / root)

1. **Settings → Pages → Source**: Deploy from a branch
2. Branch: `main` → pasta `/ (root)`
3. O arquivo `.nojekyll` já está incluso (obrigatório para servir JS/JSON corretamente).

### Importante

- Acesse sempre com a **barra final**: `.../NOME-DO-REPO/`
- Admin: `.../NOME-DO-REPO/admin/`
- O app detecta automaticamente a subpasta do repositório (não precisa configurar URL manualmente).
- PWA e service worker usam o `scope` da pasta do projeto.

> Não abra o `index.html` como arquivo local (`file://`). No GitHub Pages o `fetch` dos JSON funciona normalmente.

## Personalização rápida (sem programar)

### 1. Dados da loja

Edite `data/loja.json`:

- `nome`, `slogan`, `logo`
- `whatsapp` — número com DDI (ex: `5511999999999`)
- `horarioAbertura` / `horarioFechamento`
- `taxaEntrega`, `pedidoMinimo`
- `chavePix`, cupons, taxas por bairro
- Senha do admin em `admin.usuario` / `admin.senha`

### 2. Produtos e categorias

Edite os arquivos em `data/`:

- `produtos.json`
- `categorias.json`
- `banners.json`

Ou use o painel: **/admin** (usuário `admin` / senha `admin123`).

### 3. Imagens

Substitua os SVGs em `assets/images/` e `assets/images/produtos/` pelas fotos reais (JPG/PNG/WebP) e atualize os caminhos nos JSON.

## Painel administrativo

URL: `/admin/`

| Recurso | Função |
|---------|--------|
| Produtos | Criar, editar, excluir, ativar/desativar |
| Categorias | Gerenciar categorias |
| Banners | Carrossel da home |
| Promoções | Produtos em oferta + cupons |
| Loja | WhatsApp, horário, PIX, SEO, cores |
| Configurações | Trocar senha, importar/exportar JSON |

As alterações do admin ficam no **LocalStorage** do navegador. Use **Exportar JSON** e substitua os arquivos em `data/` para publicar de forma permanente.

**Troque a senha padrão antes de entregar ao cliente.**

## Funcionalidades do cliente

- Status aberto/fechado automático por horário
- Busca de produtos
- Filtro por categorias
- Banners com troca automática
- Carrinho lateral (salvo no navegador)
- Cupom de desconto
- Entrega ou retirada
- Taxa por bairro
- Finalização via WhatsApp com mensagem formatada
- PWA — “Adicionar à tela inicial”

## Estrutura

```
/
├── index.html
├── manifest.json
├── service-worker.js
├── admin/
├── assets/css/
├── assets/js/
├── assets/images/
└── data/
```

## Tecnologias

- HTML5, CSS3, JavaScript (Vanilla)
- JSON + LocalStorage
- PWA (manifest + service worker)
- Sem backend obrigatório

## Checklist antes de vender / entregar

1. [ ] Alterar WhatsApp em `data/loja.json`
2. [ ] Trocar senha do admin
3. [ ] Colocar logo e fotos reais
4. [ ] Ajustar horários e taxa de entrega
5. [ ] Configurar chave PIX
6. [ ] Revisar preços e produtos
7. [ ] Publicar no GitHub Pages (ou outro host estático)
8. [ ] Testar pedido completo no celular

## Licença de uso comercial

Este projeto foi desenvolvido para uso e revenda comercial. Você pode white-label (trocar marca, cores e dados) e entregar ao cliente final.

---

Desenvolvido para adegas e delivery de bebidas.
