/**
 * Carrinho de compras com LocalStorage
 */
const Carrinho = {
  STORAGE_KEY: "cardapio_carrinho_v1",
  CUPOM_KEY: "cardapio_cupom_v1",
  itens: [],
  cupom: null,
  loja: null,
  tipoEntrega: "entrega",
  bairroSelecionado: null,

  init(loja) {
    this.loja = loja;
    this.carregar();
    this.bindUI();
    this.render();
  },

  carregar() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      this.itens = raw ? JSON.parse(raw) : [];
      const cupomRaw = localStorage.getItem(this.CUPOM_KEY);
      this.cupom = cupomRaw ? JSON.parse(cupomRaw) : null;
    } catch {
      this.itens = [];
      this.cupom = null;
    }
  },

  salvar() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.itens));
    if (this.cupom) {
      localStorage.setItem(this.CUPOM_KEY, JSON.stringify(this.cupom));
    } else {
      localStorage.removeItem(this.CUPOM_KEY);
    }
  },

  quantidade(produtoId) {
    const item = this.itens.find((i) => i.id === produtoId);
    return item ? item.quantidade : 0;
  },

  totalItens() {
    return this.itens.reduce((acc, i) => acc + i.quantidade, 0);
  },

  adicionar(produtoId) {
    const produto = Produtos.obter(produtoId);
    if (!produto) return;

    const existente = this.itens.find((i) => i.id === produtoId);
    if (existente) {
      existente.quantidade += 1;
    } else {
      this.itens.push({
        id: produto.id,
        nome: produto.nome,
        imagem: produto.imagem,
        preco: Utils.precoFinal(produto),
        quantidade: 1,
      });
    }

    this.salvar();
    this.render();
    this.animarBadge();
    Produtos.atualizarQuantidades();
  },

  removerUm(produtoId) {
    const item = this.itens.find((i) => i.id === produtoId);
    if (!item) return;

    item.quantidade -= 1;
    if (item.quantidade <= 0) {
      this.itens = this.itens.filter((i) => i.id !== produtoId);
    }

    this.salvar();
    this.render();
    Produtos.atualizarQuantidades();
  },

  definirQuantidade(produtoId, qty) {
    const item = this.itens.find((i) => i.id === produtoId);
    if (!item) return;
    if (qty <= 0) {
      this.itens = this.itens.filter((i) => i.id !== produtoId);
    } else {
      item.quantidade = qty;
    }
    this.salvar();
    this.render();
    Produtos.atualizarQuantidades();
  },

  remover(produtoId) {
    this.itens = this.itens.filter((i) => i.id !== produtoId);
    this.salvar();
    this.render();
    Produtos.atualizarQuantidades();
  },

  limpar() {
    this.itens = [];
    this.cupom = null;
    this.salvar();
    this.render();
    Produtos.atualizarQuantidades();
  },

  subtotal() {
    return this.itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
  },

  taxaEntrega() {
    if (this.tipoEntrega === "retirada") return 0;

    if (this.bairroSelecionado && this.loja?.taxasBairro) {
      const bairro = this.loja.taxasBairro.find(
        (b) => b.bairro === this.bairroSelecionado
      );
      if (bairro) return Number(bairro.taxa);
    }

    return Number(this.loja?.taxaEntrega || 0);
  },

  desconto() {
    if (!this.cupom) return 0;
    const sub = this.subtotal();
    if (this.cupom.minimo && sub < this.cupom.minimo) return 0;

    if (this.cupom.tipo === "percentual") {
      return (sub * Number(this.cupom.valor)) / 100;
    }
    if (this.cupom.tipo === "frete") {
      return Math.min(this.taxaEntrega(), Number(this.cupom.valor));
    }
    return Number(this.cupom.valor);
  },

  total() {
    return Math.max(0, this.subtotal() + this.taxaEntrega() - this.desconto());
  },

  pedidoMinimoOk() {
    const minimo = Number(this.loja?.pedidoMinimo || 0);
    return this.subtotal() >= minimo;
  },

  aplicarCupom(codigo) {
    const code = String(codigo || "").trim().toUpperCase();
    if (!code) {
      Utils.toast("Digite um cupom", "erro");
      return false;
    }

    const cupons = this.loja?.cupons || [];
    const encontrado = cupons.find(
      (c) => c.ativo && String(c.codigo).toUpperCase() === code
    );

    if (!encontrado) {
      Utils.toast("Cupom inválido", "erro");
      return false;
    }

    if (encontrado.minimo && this.subtotal() < encontrado.minimo) {
      Utils.toast(
        `Pedido mínimo de ${Utils.formatarPreco(encontrado.minimo)} para este cupom`,
        "erro"
      );
      return false;
    }

    this.cupom = encontrado;
    this.salvar();
    this.render();
    Utils.toast(`Cupom ${encontrado.codigo} aplicado!`);
    return true;
  },

  removerCupom() {
    this.cupom = null;
    this.salvar();
    this.render();
  },

  abrir() {
    document.getElementById("carrinho-overlay")?.classList.add("aberto");
    document.getElementById("carrinho-drawer")?.classList.add("aberto");
    document.body.style.overflow = "hidden";
  },

  fechar() {
    document.getElementById("carrinho-overlay")?.classList.remove("aberto");
    document.getElementById("carrinho-drawer")?.classList.remove("aberto");
    document.body.style.overflow = "";
  },

  animarBadge() {
    const badge = document.getElementById("carrinho-badge");
    if (!badge) return;
    badge.classList.remove("animar-bounce");
    void badge.offsetWidth;
    badge.classList.add("animar-bounce");
  },

  bindUI() {
    document
      .getElementById("carrinho-btn-flutuante")
      ?.addEventListener("click", () => this.abrir());
    document
      .getElementById("carrinho-fechar")
      ?.addEventListener("click", () => this.fechar());
    document
      .getElementById("carrinho-overlay")
      ?.addEventListener("click", () => this.fechar());
    document
      .getElementById("btn-aplicar-cupom")
      ?.addEventListener("click", () => {
        const input = document.getElementById("cupom-input");
        this.aplicarCupom(input?.value);
      });
    document.getElementById("btn-finalizar")?.addEventListener("click", () => {
      if (!Horario.estaAberta()) {
        Utils.toast("Loja fechada no momento", "erro");
        return;
      }
      if (!this.itens.length) {
        Utils.toast("Carrinho vazio", "erro");
        return;
      }
      if (!this.pedidoMinimoOk()) {
        Utils.toast(
          `Pedido mínimo: ${Utils.formatarPreco(this.loja.pedidoMinimo)}`,
          "erro"
        );
        return;
      }
      this.fechar();
      WhatsApp.abrirModal();
    });
  },

  render() {
    const badge = document.getElementById("carrinho-badge");
    const btnFloat = document.getElementById("carrinho-btn-flutuante");
    const totalItens = this.totalItens();

    if (badge) {
      badge.textContent = totalItens;
      badge.style.display = totalItens > 0 ? "flex" : "none";
    }
    btnFloat?.classList.toggle("vazio-carrinho", totalItens === 0);

    const lista = document.getElementById("carrinho-itens");
    const vazio = document.getElementById("carrinho-vazio");
    const footer = document.getElementById("carrinho-footer");

    if (!lista) return;

    if (!this.itens.length) {
      lista.innerHTML = "";
      lista.classList.add("oculto");
      vazio?.classList.remove("oculto");
      footer?.classList.add("oculto");
      return;
    }

    lista.classList.remove("oculto");
    vazio?.classList.add("oculto");
    footer?.classList.remove("oculto");

    lista.innerHTML = this.itens
      .map(
        (item) => `
      <div class="carrinho-item" data-item="${item.id}">
        <img
          class="carrinho-item-img"
          src="${Utils.escaparHtml(item.imagem)}"
          alt="${Utils.escaparHtml(item.nome)}"
          onerror="this.src='assets/images/produto-placeholder.svg'"
        />
        <div class="carrinho-item-info">
          <div class="carrinho-item-nome">${Utils.escaparHtml(item.nome)}</div>
          <div class="carrinho-item-preco">${Utils.formatarPreco(item.preco * item.quantidade)}</div>
          <div class="carrinho-item-acoes">
            <div class="qty-controle">
              <button type="button" data-cart-menos="${item.id}" aria-label="Diminuir">−</button>
              <span>${item.quantidade}</span>
              <button type="button" data-cart-mais="${item.id}" aria-label="Aumentar">+</button>
            </div>
            <button type="button" class="btn-remover-item" data-cart-remover="${item.id}">Remover</button>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    lista.querySelectorAll("[data-cart-mais]").forEach((btn) => {
      btn.addEventListener("click", () => this.adicionar(btn.dataset.cartMais));
    });
    lista.querySelectorAll("[data-cart-menos]").forEach((btn) => {
      btn.addEventListener("click", () => this.removerUm(btn.dataset.cartMenos));
    });
    lista.querySelectorAll("[data-cart-remover]").forEach((btn) => {
      btn.addEventListener("click", () => this.remover(btn.dataset.cartRemover));
    });

    this.renderResumo();
  },

  renderResumo() {
    const subEl = document.getElementById("resumo-subtotal");
    const entEl = document.getElementById("resumo-entrega");
    const descEl = document.getElementById("resumo-desconto");
    const descLinha = document.getElementById("resumo-desconto-linha");
    const totalEl = document.getElementById("resumo-total");
    const avisoMin = document.getElementById("aviso-pedido-minimo");
    const btnFinalizar = document.getElementById("btn-finalizar");

    if (subEl) subEl.textContent = Utils.formatarPreco(this.subtotal());
    if (entEl) {
      entEl.textContent =
        this.tipoEntrega === "retirada"
          ? "Grátis (retirada)"
          : Utils.formatarPreco(this.taxaEntrega());
    }

    const desc = this.desconto();
    if (descLinha) descLinha.classList.toggle("oculto", desc <= 0);
    if (descEl) descEl.textContent = `- ${Utils.formatarPreco(desc)}`;
    if (totalEl) totalEl.textContent = Utils.formatarPreco(this.total());

    const aberto = Horario.estaAberta();
    const minOk = this.pedidoMinimoOk();

    if (avisoMin) {
      if (!minOk) {
        avisoMin.classList.remove("oculto");
        avisoMin.textContent = `Pedido mínimo: ${Utils.formatarPreco(this.loja.pedidoMinimo)}`;
      } else if (!aberto) {
        avisoMin.classList.remove("oculto");
        avisoMin.textContent = "Loja fechada — pedidos indisponíveis";
      } else {
        avisoMin.classList.add("oculto");
      }
    }

    if (btnFinalizar) {
      btnFinalizar.disabled = !this.itens.length || !minOk || !aberto;
    }

    const cupomInput = document.getElementById("cupom-input");
    if (cupomInput && this.cupom) {
      cupomInput.value = this.cupom.codigo;
    }
  },
};

window.Carrinho = Carrinho;
