/**
 * Renderização e filtros de produtos
 */
const Produtos = {
  todos: [],
  filtrados: [],
  filtroAtual: { categoria: null, busca: "" },

  init(produtos) {
    this.todos = (produtos || [])
      .filter((p) => p.ativo !== false)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    this.filtrados = [...this.todos];
    this.render();
  },

  obter(id) {
    return this.todos.find((p) => p.id === id);
  },

  filtrar({ categoria = null, busca = "" } = {}) {
    this.filtroAtual = { categoria, busca: busca.trim().toLowerCase() };

    this.filtrados = this.todos.filter((p) => {
      const okCat = !categoria || p.categoria === categoria;
      const okBusca =
        !this.filtroAtual.busca ||
        p.nome.toLowerCase().includes(this.filtroAtual.busca) ||
        (p.descricao || "").toLowerCase().includes(this.filtroAtual.busca);
      return okCat && okBusca;
    });

    this.render();
  },

  render() {
    const container = document.getElementById("produtos-grid");
    if (!container) return;

    if (this.filtrados.length === 0) {
      container.innerHTML = `
        <div class="vazio" style="grid-column: 1 / -1;">
          <div class="icone">🔍</div>
          <p>Nenhum produto encontrado</p>
        </div>
      `;
      return;
    }

    const agrupado = !this.filtroAtual.categoria && !this.filtroAtual.busca;

    if (agrupado && window.Categorias) {
      let html = "";
      Categorias.lista.forEach((cat) => {
        const itens = this.filtrados.filter((p) => p.categoria === cat.id);
        if (!itens.length) return;
        html += `
          <h3 class="categoria-titulo-grupo" id="cat-${cat.id}" style="grid-column: 1 / -1;">
            <span>${cat.icone || ""}</span> ${Utils.escaparHtml(cat.nome)}
          </h3>
        `;
        html += itens.map((p) => this.cardHtml(p)).join("");
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = this.filtrados.map((p) => this.cardHtml(p)).join("");
    }

    this.bindEventos(container);
    this.atualizarQuantidades();
  },

  cardHtml(produto) {
    const preco = Utils.precoFinal(produto);
    const temPromo =
      produto.promocao &&
      produto.precoPromocional != null &&
      produto.precoPromocional < produto.preco;
    const qty = window.Carrinho ? Carrinho.quantidade(produto.id) : 0;

    return `
      <article class="produto-card" data-id="${produto.id}">
        <div class="produto-imagem-wrap">
          ${temPromo ? '<span class="produto-tag">Promo</span>' : ""}
          <img
            src="${Utils.escaparHtml(produto.imagem)}"
            alt="${Utils.escaparHtml(produto.nome)}"
            loading="lazy"
            onerror="this.src='assets/images/produto-placeholder.svg'"
          />
        </div>
        <div class="produto-info">
          <h3 class="produto-nome">${Utils.escaparHtml(produto.nome)}</h3>
          <p class="produto-desc">${Utils.escaparHtml(produto.descricao || "")}</p>
          <div class="produto-footer">
            <div class="produto-precos">
              ${temPromo ? `<span class="preco-antigo">${Utils.formatarPreco(produto.preco)}</span>` : ""}
              <span class="produto-preco">${Utils.formatarPreco(preco)}</span>
            </div>
            <button class="btn-adicionar ${qty > 0 ? "oculto" : ""}" data-add="${produto.id}" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Adicionar
            </button>
            <div class="produto-qty-controle ${qty > 0 ? "visivel" : ""}" data-qty-wrap="${produto.id}">
              <button type="button" data-menos="${produto.id}" aria-label="Diminuir">−</button>
              <span data-qty="${produto.id}">${qty}</span>
              <button type="button" data-mais="${produto.id}" aria-label="Aumentar">+</button>
            </div>
          </div>
        </div>
      </article>
    `;
  },

  bindEventos(container) {
    container.querySelectorAll("[data-add]").forEach((btn) => {
      btn.addEventListener("click", () => {
        Carrinho.adicionar(btn.dataset.add);
        Utils.toast("Adicionado ao carrinho");
      });
    });

    container.querySelectorAll("[data-mais]").forEach((btn) => {
      btn.addEventListener("click", () => Carrinho.adicionar(btn.dataset.mais));
    });

    container.querySelectorAll("[data-menos]").forEach((btn) => {
      btn.addEventListener("click", () => Carrinho.removerUm(btn.dataset.menos));
    });
  },

  atualizarQuantidades() {
    if (!window.Carrinho) return;
    this.todos.forEach((p) => {
      const qty = Carrinho.quantidade(p.id);
      const span = document.querySelector(`[data-qty="${p.id}"]`);
      const wrap = document.querySelector(`[data-qty-wrap="${p.id}"]`);
      const addBtn = document.querySelector(`[data-add="${p.id}"]`);
      if (span) span.textContent = qty;
      if (wrap) wrap.classList.toggle("visivel", qty > 0);
      if (addBtn) addBtn.classList.toggle("oculto", qty > 0);
    });
  },
};

window.Produtos = Produtos;
