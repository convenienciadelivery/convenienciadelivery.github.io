/**
 * Painel Administrativo — Cardápio Digital + Delivery
 * Dados salvos em LocalStorage e sincronizados com a loja pública
 */
const Admin = {
  PREFIX: "cardapio_admin_",
  SESSION: "cardapio_admin_session",
  dados: {
    loja: null,
    produtos: [],
    categorias: [],
    banners: [],
  },
  modalCallback: null,
  editando: null,

  async init() {
    await this.carregarTudo();

    if (sessionStorage.getItem(this.SESSION) === "1") {
      this.mostrarPainel();
    } else {
      this.mostrarLogin();
    }

    this.bindLogin();
    this.bindNav();
    this.bindAcoes();
  },

  async carregarTudo() {
    this.dados.loja = await this.load("loja");
    this.dados.produtos = await this.load("produtos");
    this.dados.categorias = await this.load("categorias");
    this.dados.banners = await this.load("banners");
  },

  async load(tipo) {
    const local = localStorage.getItem(this.PREFIX + tipo);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        /* fallback */
      }
    }

    // Dados embutidos (funciona abrindo admin/index.html direto, sem servidor)
    if (window.CARDAPIO_DATA && window.CARDAPIO_DATA[tipo] != null) {
      return JSON.parse(JSON.stringify(window.CARDAPIO_DATA[tipo]));
    }

    try {
      const url =
        (typeof assetUrl === "function"
          ? assetUrl(`data/${tipo}.json`)
          : `../data/${tipo}.json`) + `?v=${Date.now()}`;
      const resp = await fetch(url);
      if (resp.ok) return resp.json();
    } catch {
      /* file:// */
    }

    throw new Error(`Erro ao carregar ${tipo}`);
  },

  salvarLocal(tipo, data) {
    localStorage.setItem(this.PREFIX + tipo, JSON.stringify(data));
  },

  salvarTudo() {
    this.salvarLocal("loja", this.dados.loja);
    this.salvarLocal("produtos", this.dados.produtos);
    this.salvarLocal("categorias", this.dados.categorias);
    this.salvarLocal("banners", this.dados.banners);
    this.toast("Alterações salvas! A loja já reflete os dados.", "ok");
  },

  toast(msg, tipo = "ok") {
    const box = document.getElementById("toast-box");
    const el = document.createElement("div");
    el.className = `toast ${tipo}`;
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  },

  /* —— Login —— */
  mostrarLogin() {
    document.getElementById("tela-login").classList.remove("oculto");
    document.getElementById("tela-admin").classList.add("oculto");
  },

  mostrarPainel() {
    document.getElementById("tela-login").classList.add("oculto");
    document.getElementById("tela-admin").classList.remove("oculto");
    document.getElementById("sidebar-loja-nome").textContent =
      this.dados.loja?.nome || "Loja";
    this.renderDashboard();
    this.renderPedidos();
    this.renderProdutos();
    this.renderCategorias();
    this.renderBanners();
    this.renderPromocoes();
    this.renderCupons();
    this.renderLoja();
    this.renderConfig();
  },

  bindLogin() {
    document.getElementById("form-login")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const user = document.getElementById("login-usuario").value.trim();
      const pass = document.getElementById("login-senha").value;
      const admin = this.dados.loja?.admin || { usuario: "admin", senha: "admin" };

      if (user === admin.usuario && pass === admin.senha) {
        sessionStorage.setItem(this.SESSION, "1");
        document.getElementById("login-erro").classList.add("oculto");
        this.mostrarPainel();
      } else {
        document.getElementById("login-erro").classList.remove("oculto");
      }
    });

    document.getElementById("btn-logout")?.addEventListener("click", () => {
      sessionStorage.removeItem(this.SESSION);
      this.mostrarLogin();
    });
  },

  /* —— Navegação —— */
  bindNav() {
    const titulos = {
      dashboard: "Dashboard",
      pedidos: "Pedidos",
      produtos: "Produtos",
      categorias: "Categorias",
      banners: "Banners",
      promocoes: "Promoções",
      loja: "Loja",
      config: "Configurações",
    };

    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("ativo"));
        btn.classList.add("ativo");
        document.querySelectorAll(".aba").forEach((a) => a.classList.remove("ativo"));
        document.getElementById(`aba-${btn.dataset.aba}`)?.classList.add("ativo");
        document.getElementById("titulo-aba").textContent = titulos[btn.dataset.aba] || "";
        document.querySelector(".sidebar")?.classList.remove("aberta");
        document.getElementById("sidebar-backdrop")?.classList.remove("visivel");
      });
    });

    // Backdrop mobile
    if (!document.getElementById("sidebar-backdrop")) {
      const bd = document.createElement("div");
      bd.id = "sidebar-backdrop";
      bd.className = "sidebar-backdrop";
      document.body.appendChild(bd);
      bd.addEventListener("click", () => {
        document.querySelector(".sidebar")?.classList.remove("aberta");
        bd.classList.remove("visivel");
      });
    }

    document.getElementById("btn-menu")?.addEventListener("click", () => {
      document.querySelector(".sidebar")?.classList.toggle("aberta");
      document.getElementById("sidebar-backdrop")?.classList.toggle("visivel");
    });
  },

  bindAcoes() {
    document.getElementById("btn-salvar-tudo")?.addEventListener("click", () => {
      this.lerFormLoja();
      this.salvarTudo();
    });

    document.getElementById("btn-exportar")?.addEventListener("click", () => this.exportar());

    document.getElementById("btn-novo-produto")?.addEventListener("click", () =>
      this.abrirModalProduto(null)
    );
    document.getElementById("btn-nova-categoria")?.addEventListener("click", () =>
      this.abrirModalCategoria(null)
    );
    document.getElementById("btn-novo-banner")?.addEventListener("click", () =>
      this.abrirModalBanner(null)
    );
    document.getElementById("btn-novo-cupom")?.addEventListener("click", () =>
      this.abrirModalCupom(null)
    );

    document.getElementById("busca-produtos")?.addEventListener("input", () =>
      this.renderProdutos()
    );
    document.getElementById("filtro-cat-produtos")?.addEventListener("change", () =>
      this.renderProdutos()
    );

    document.getElementById("btn-add-bairro")?.addEventListener("click", () => {
      if (!this.dados.loja.taxasBairro) this.dados.loja.taxasBairro = [];
      this.dados.loja.taxasBairro.push({ bairro: "Novo bairro", taxa: 5 });
      this.renderBairros();
    });

    document.getElementById("loja-logo-file")?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      this.lerArquivoComoDataUrl(file, (dataUrl) => {
        document.getElementById("loja-logo").value = dataUrl;
        this.toast("Logo carregada — clique em Salvar alterações", "ok");
      });
    });

    document.getElementById("btn-salvar-login")?.addEventListener("click", () => {
      const user = document.getElementById("config-usuario").value.trim();
      const pass = document.getElementById("config-senha").value;
      if (!user) return this.toast("Informe o usuário", "erro");
      this.dados.loja.admin = this.dados.loja.admin || {};
      this.dados.loja.admin.usuario = user;
      if (pass) this.dados.loja.admin.senha = pass;
      this.salvarLocal("loja", this.dados.loja);
      document.getElementById("config-senha").value = "";
      this.toast("Login atualizado", "ok");
    });

    document.getElementById("busca-pedidos")?.addEventListener("input", () => this.renderPedidos());
    document.getElementById("filtro-status-pedidos")?.addEventListener("change", () => this.renderPedidos());
    document.getElementById("btn-exportar-pedidos")?.addEventListener("click", () => this.exportarPedidos());
    document.getElementById("btn-importar-pedido")?.addEventListener("click", () => {
      document.getElementById("input-importar-pedido")?.click();
    });
    document.getElementById("input-importar-pedido")?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const pedidos = Array.isArray(data) ? data : [data];
          pedidos.forEach((p) => {
            if (!p.id) p.id = `ped_imp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            if (!p.dataHora) p.dataHora = new Date().toISOString();
            if (!p.status) p.status = "novo";
            PedidosStore.adicionar(p);
          });
          this.renderPedidos();
          this.toast(`${pedidos.length} pedido(s) importado(s)`, "ok");
        } catch {
          this.toast("Arquivo JSON inválido", "erro");
        }
        e.target.value = "";
      };
      reader.readAsText(file);
    });
    document.getElementById("btn-limpar-pedidos")?.addEventListener("click", () => {
      if (!confirm("Apagar TODOS os pedidos salvos neste navegador?")) return;
      PedidosStore.limpar();
      this.renderPedidos();
      this.renderDashboard();
      this.toast("Histórico de pedidos limpo", "ok");
    });

    document.getElementById("btn-resetar")?.addEventListener("click", async () => {
      if (!confirm("Restaurar dados padrão? As alterações locais serão apagadas.")) return;
      ["loja", "produtos", "categorias", "banners"].forEach((t) =>
        localStorage.removeItem(this.PREFIX + t)
      );
      await this.carregarTudo();
      this.mostrarPainel();
      this.toast("Dados restaurados", "ok");
    });

    document.getElementById("btn-importar")?.addEventListener("click", () => {
      const tipo = document.getElementById("import-tipo").value;
      const raw = document.getElementById("import-json").value.trim();
      try {
        const data = JSON.parse(raw);
        this.dados[tipo] = data;
        this.salvarLocal(tipo, data);
        this.mostrarPainel();
        this.toast(`${tipo} importado com sucesso`, "ok");
        document.getElementById("import-json").value = "";
      } catch {
        this.toast("JSON inválido", "erro");
      }
    });

    document.getElementById("modal-x")?.addEventListener("click", () => this.fecharModal());
    document.getElementById("modal-cancelar")?.addEventListener("click", () => this.fecharModal());
    document.getElementById("modal-bg")?.addEventListener("click", (e) => {
      if (e.target.id === "modal-bg") this.fecharModal();
    });
    document.getElementById("modal-salvar")?.addEventListener("click", () => {
      if (typeof this.modalCallback === "function") this.modalCallback();
    });
  },

  /* —— Dashboard —— */
  renderDashboard() {
    const ativos = this.dados.produtos.filter((p) => p.ativo !== false);
    document.getElementById("stat-produtos").textContent = ativos.length;
    document.getElementById("stat-promos").textContent = ativos.filter(
      (p) => p.promocao
    ).length;
    document.getElementById("stat-categorias").textContent =
      this.dados.categorias.filter((c) => c.ativo !== false).length;
    document.getElementById("stat-banners").textContent =
      this.dados.banners.filter((b) => b.ativo !== false).length;

    const pedidos = window.PedidosStore ? PedidosStore.listar() : [];
    const elPed = document.getElementById("stat-pedidos");
    if (elPed) elPed.textContent = pedidos.length;

    const badge = document.getElementById("nav-badge-pedidos");
    const novos = pedidos.filter((p) => p.status === "novo").length;
    if (badge) {
      if (novos > 0) {
        badge.hidden = false;
        badge.textContent = String(novos);
      } else {
        badge.hidden = true;
      }
    }
  },

  /* —— Pedidos —— */
  formatarDataPedido(iso) {
    try {
      return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso || "";
    }
  },

  formatarPreco(v) {
    return Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  },

  waLinkCliente(digits) {
    let n = String(digits || "").replace(/\D/g, "");
    if (!n) return "#";
    if (n.length <= 11) n = "55" + n;
    return `https://wa.me/${n}`;
  },

  renderPedidos() {
    const el = document.getElementById("lista-pedidos");
    if (!el || !window.PedidosStore) return;

    const busca = (document.getElementById("busca-pedidos")?.value || "")
      .toLowerCase()
      .trim();
    const statusFiltro = document.getElementById("filtro-status-pedidos")?.value || "";

    let lista = PedidosStore.listar();

    if (statusFiltro) {
      lista = lista.filter((p) => p.status === statusFiltro);
    }
    if (busca) {
      lista = lista.filter((p) => {
        const texto = [
          p.nome,
          p.telefone,
          p.endereco,
          p.bairro,
          p.observacao,
          ...(p.itens || []).map((i) => i.nome),
        ]
          .join(" ")
          .toLowerCase();
        return texto.includes(busca);
      });
    }

    this.renderDashboard();

    if (!lista.length) {
      el.innerHTML = `
        <div class="card">
          <p class="texto-muted" style="margin:0">Nenhum pedido encontrado.</p>
          <p class="texto-muted" style="margin-top:8px">Quando um cliente finalizar e enviar pelo WhatsApp, o pedido aparece aqui.</p>
        </div>`;
      return;
    }

    el.innerHTML = lista
      .map((p) => {
        const itensHtml = (p.itens || [])
          .map(
            (i) => `
            <div class="pedido-item-admin">
              <img src="${this.esc(i.imagem || "../assets/images/produto-placeholder.svg")}" alt="" onerror="this.src='../assets/images/produto-placeholder.svg'"/>
              <div>
                <strong>${this.esc(i.nome)}</strong>
                <span>${i.quantidade}x · ${this.formatarPreco(i.preco)} = <b>${this.formatarPreco(i.subtotal ?? i.preco * i.quantidade)}</b></span>
              </div>
            </div>`
          )
          .join("");

        const wa = this.waLinkCliente(p.telefoneDigits || p.telefone);
        const statusClass = p.status === "atendido" ? "badge-ok" : "badge-promo";
        const statusLabel = p.status === "atendido" ? "Atendido" : "Novo";
        const tipo =
          p.tipoEntrega === "retirada" ? "Retirada no balcão" : "Entrega";

        return `
        <article class="pedido-card ${p.status === "novo" ? "pedido-novo" : ""}" data-pedido-id="${this.esc(p.id)}">
          <div class="pedido-card-topo">
            <div>
              <div class="pedido-card-meta">${this.formatarDataPedido(p.dataHora)}</div>
              <h3>${this.esc(p.nome || "Cliente")}</h3>
            </div>
            <span class="badge ${statusClass}">${statusLabel}</span>
          </div>

          <div class="pedido-card-grid">
            <div>
              <span class="label">Telefone / WhatsApp</span>
              <a class="pedido-wa" href="${wa}" target="_blank" rel="noopener">${this.esc(p.telefone || "—")}</a>
            </div>
            <div>
              <span class="label">Tipo</span>
              <strong>${tipo}</strong>
            </div>
            <div>
              <span class="label">Pagamento</span>
              <strong>PIX${p.chavePix ? ` · ${this.esc(p.chavePix)}` : ""}</strong>
            </div>
          </div>

          ${
            p.tipoEntrega !== "retirada"
              ? `<div class="pedido-endereco">
                  <span class="label">Endereço de entrega</span>
                  <p>${this.esc(p.endereco || "Não informado")}${p.bairro ? `<br><small>Bairro: ${this.esc(p.bairro)}</small>` : ""}</p>
                </div>`
              : ""
          }

          ${
            p.observacao
              ? `<div class="pedido-obs"><span class="label">Observação</span><p>${this.esc(p.observacao)}</p></div>`
              : ""
          }

          <div class="pedido-itens-bloco">
            <span class="label">Itens do pedido</span>
            ${itensHtml}
          </div>

          <div class="pedido-totais">
            <div><span>Subtotal</span><span>${this.formatarPreco(p.subtotal)}</span></div>
            <div><span>Entrega</span><span>${p.tipoEntrega === "retirada" ? "Grátis" : this.formatarPreco(p.entrega)}</span></div>
            ${p.desconto > 0 ? `<div><span>Desconto${p.cupom ? ` (${this.esc(p.cupom)})` : ""}</span><span>- ${this.formatarPreco(p.desconto)}</span></div>` : ""}
            <div class="total"><span>Total</span><span>${this.formatarPreco(p.total)}</span></div>
          </div>

          <div class="pedido-acoes">
            <a class="btn btn-primario btn-sm" href="${wa}" target="_blank" rel="noopener">Abrir WhatsApp</a>
            ${
              p.status !== "atendido"
                ? `<button type="button" class="btn btn-outline btn-sm" data-atender="${this.esc(p.id)}">Marcar atendido</button>`
                : `<button type="button" class="btn btn-outline btn-sm" data-reabrir="${this.esc(p.id)}">Reabrir</button>`
            }
            <button type="button" class="btn btn-ghost btn-sm" data-del-pedido="${this.esc(p.id)}" style="color:#DC2626">Excluir</button>
          </div>
        </article>`;
      })
      .join("");

    el.querySelectorAll("[data-atender]").forEach((btn) => {
      btn.addEventListener("click", () => {
        PedidosStore.atualizarStatus(btn.dataset.atender, "atendido");
        this.renderPedidos();
        this.toast("Pedido marcado como atendido", "ok");
      });
    });
    el.querySelectorAll("[data-reabrir]").forEach((btn) => {
      btn.addEventListener("click", () => {
        PedidosStore.atualizarStatus(btn.dataset.reabrir, "novo");
        this.renderPedidos();
      });
    });
    el.querySelectorAll("[data-del-pedido]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Excluir este pedido do histórico?")) return;
        PedidosStore.remover(btn.dataset.delPedido);
        this.renderPedidos();
        this.toast("Pedido excluído", "ok");
      });
    });
  },

  exportarPedidos() {
    const lista = PedidosStore.listar();
    const blob = new Blob([JSON.stringify(lista, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    this.toast("Pedidos exportados", "ok");
  },

  /* —— Produtos —— */
  renderProdutos() {
    const tbody = document.querySelector("#tabela-produtos tbody");
    const filtro = document.getElementById("filtro-cat-produtos");
    const busca = (document.getElementById("busca-produtos")?.value || "").toLowerCase();
    const catFiltro = filtro?.value || "";

    if (filtro && filtro.options.length <= 1) {
      this.dados.categorias.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.nome;
        filtro.appendChild(opt);
      });
    }

    let lista = [...this.dados.produtos];
    if (catFiltro) lista = lista.filter((p) => p.categoria === catFiltro);
    if (busca) {
      lista = lista.filter(
        (p) =>
          p.nome.toLowerCase().includes(busca) ||
          (p.descricao || "").toLowerCase().includes(busca)
      );
    }

    const catNome = (id) =>
      this.dados.categorias.find((c) => c.id === id)?.nome || id;

    tbody.innerHTML = lista
      .map((p) => {
        const promo =
          p.promocao && p.precoPromocional != null
            ? `R$ ${Number(p.precoPromocional).toFixed(2)}`
            : "—";
        return `
        <tr>
          <td><img class="thumb" src="../${p.imagem}" alt="" onerror="this.src='../assets/images/produto-placeholder.svg'"/></td>
          <td><strong>${this.esc(p.nome)}</strong></td>
          <td>${this.esc(catNome(p.categoria))}</td>
          <td>R$ ${Number(p.preco).toFixed(2)}</td>
          <td>${promo}</td>
          <td>
            <span class="badge ${p.ativo !== false ? "badge-ok" : "badge-off"}">
              ${p.ativo !== false ? "Ativo" : "Inativo"}
            </span>
            ${p.promocao ? '<span class="badge badge-promo">Promo</span>' : ""}
          </td>
          <td class="acoes">
            <button class="btn btn-outline btn-sm" data-edit-prod="${p.id}">Editar</button>
            <button class="btn btn-outline btn-sm" data-toggle-prod="${p.id}">${p.ativo !== false ? "Desativar" : "Ativar"}</button>
            <button class="btn btn-ghost btn-sm" data-del-prod="${p.id}" style="color:#DC2626">Excluir</button>
          </td>
        </tr>`;
      })
      .join("");

    tbody.querySelectorAll("[data-edit-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = this.dados.produtos.find((x) => x.id === btn.dataset.editProd);
        this.abrirModalProduto(p);
      });
    });
    tbody.querySelectorAll("[data-toggle-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = this.dados.produtos.find((x) => x.id === btn.dataset.toggleProd);
        if (p) {
          p.ativo = p.ativo === false;
          this.renderProdutos();
          this.renderDashboard();
        }
      });
    });
    tbody.querySelectorAll("[data-del-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Excluir este produto?")) return;
        this.dados.produtos = this.dados.produtos.filter(
          (x) => x.id !== btn.dataset.delProd
        );
        this.renderProdutos();
        this.renderDashboard();
        this.renderPromocoes();
      });
    });
  },

  abrirModalProduto(produto) {
    const isNovo = !produto;
    const p = produto || {
      id: "",
      nome: "",
      descricao: "",
      preco: 0,
      precoPromocional: null,
      categoria: this.dados.categorias[0]?.id || "",
      imagem: "assets/images/produto-placeholder.svg",
      ativo: true,
      promocao: false,
      destaque: false,
      ordem: this.dados.produtos.length + 1,
    };

    const cats = this.dados.categorias
      .map(
        (c) =>
          `<option value="${c.id}" ${c.id === p.categoria ? "selected" : ""}>${this.esc(c.nome)}</option>`
      )
      .join("");

    document.getElementById("modal-titulo").textContent = isNovo
      ? "Novo produto"
      : "Editar produto";
    document.getElementById("modal-body").innerHTML = `
      <div class="campo"><label>Nome</label><input id="m-nome" value="${this.esc(p.nome)}" /></div>
      <div class="campo"><label>Descrição</label><textarea id="m-desc" rows="2">${this.esc(p.descricao || "")}</textarea></div>
      <div class="campo-row">
        <div class="campo"><label>Preço (R$)</label><input type="number" step="0.01" id="m-preco" value="${p.preco}" /></div>
        <div class="campo"><label>Preço promo (R$)</label><input type="number" step="0.01" id="m-promo" value="${p.precoPromocional ?? ""}" placeholder="Opcional" /></div>
      </div>
      <div class="campo"><label>Categoria</label><select id="m-cat">${cats}</select></div>
      <div class="campo"><label>Caminho / URL da imagem</label><input id="m-img" value="${this.esc(p.imagem)}" /></div>
      <div class="campo"><label>Ou enviar foto do computador</label><input type="file" id="m-img-file" accept="image/*" /></div>
      <div class="campo"><label>Ordem</label><input type="number" id="m-ordem" value="${p.ordem || 1}" /></div>
      <div class="campo check"><label><input type="checkbox" id="m-ativo" ${p.ativo !== false ? "checked" : ""}/> Ativo</label></div>
      <div class="campo check"><label><input type="checkbox" id="m-promocao" ${p.promocao ? "checked" : ""}/> Em promoção</label></div>
      <div class="campo check"><label><input type="checkbox" id="m-destaque" ${p.destaque ? "checked" : ""}/> Destaque</label></div>
    `;

    this.abrirModal();

    document.getElementById("m-img-file")?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      this.lerArquivoComoDataUrl(file, (dataUrl) => {
        document.getElementById("m-img").value = dataUrl;
        this.toast("Foto carregada", "ok");
      });
    });

    this.modalCallback = () => {
      const nome = document.getElementById("m-nome").value.trim();
      if (!nome) return this.toast("Informe o nome", "erro");

      const promoVal = document.getElementById("m-promo").value;
      const dados = {
        id: p.id || `p${Date.now()}`,
        nome,
        descricao: document.getElementById("m-desc").value.trim(),
        preco: Number(document.getElementById("m-preco").value) || 0,
        precoPromocional: promoVal === "" ? null : Number(promoVal),
        categoria: document.getElementById("m-cat").value,
        imagem: document.getElementById("m-img").value.trim() || "assets/images/produto-placeholder.svg",
        ativo: document.getElementById("m-ativo").checked,
        promocao: document.getElementById("m-promocao").checked,
        destaque: document.getElementById("m-destaque").checked,
        ordem: Number(document.getElementById("m-ordem").value) || 1,
      };

      if (isNovo) {
        this.dados.produtos.push(dados);
      } else {
        const idx = this.dados.produtos.findIndex((x) => x.id === p.id);
        if (idx >= 0) this.dados.produtos[idx] = dados;
      }

      this.fecharModal();
      this.renderProdutos();
      this.renderDashboard();
      this.renderPromocoes();
      this.toast("Produto salvo", "ok");
    };
  },

  /* —— Categorias —— */
  renderCategorias() {
    const tbody = document.querySelector("#tabela-categorias tbody");
    const lista = [...this.dados.categorias].sort(
      (a, b) => (a.ordem || 0) - (b.ordem || 0)
    );

    tbody.innerHTML = lista
      .map(
        (c) => `
      <tr>
        <td style="font-size:1.4rem">${c.icone || "📦"}</td>
        <td><strong>${this.esc(c.nome)}</strong></td>
        <td><code>${this.esc(c.id)}</code></td>
        <td>${c.ordem || 0}</td>
        <td><span class="badge ${c.ativo !== false ? "badge-ok" : "badge-off"}">${c.ativo !== false ? "Ativa" : "Inativa"}</span></td>
        <td class="acoes">
          <button class="btn btn-outline btn-sm" data-edit-cat="${c.id}">Editar</button>
          <button class="btn btn-ghost btn-sm" data-del-cat="${c.id}" style="color:#DC2626">Excluir</button>
        </td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll("[data-edit-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const c = this.dados.categorias.find((x) => x.id === btn.dataset.editCat);
        this.abrirModalCategoria(c);
      });
    });
    tbody.querySelectorAll("[data-del-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Excluir categoria?")) return;
        this.dados.categorias = this.dados.categorias.filter(
          (x) => x.id !== btn.dataset.delCat
        );
        this.renderCategorias();
        this.renderDashboard();
      });
    });
  },

  abrirModalCategoria(cat) {
    const isNovo = !cat;
    const c = cat || { id: "", nome: "", icone: "📦", ordem: 99, ativo: true };

    document.getElementById("modal-titulo").textContent = isNovo
      ? "Nova categoria"
      : "Editar categoria";
    document.getElementById("modal-body").innerHTML = `
      <div class="campo"><label>Nome</label><input id="m-cat-nome" value="${this.esc(c.nome)}" /></div>
      <div class="campo"><label>ID (slug)</label><input id="m-cat-id" value="${this.esc(c.id)}" ${isNovo ? "" : "readonly"} placeholder="ex: cervejas" /></div>
      <div class="campo"><label>Ícone (emoji)</label><input id="m-cat-icone" value="${this.esc(c.icone || "")}" /></div>
      <div class="campo"><label>Ordem</label><input type="number" id="m-cat-ordem" value="${c.ordem || 1}" /></div>
      <div class="campo check"><label><input type="checkbox" id="m-cat-ativo" ${c.ativo !== false ? "checked" : ""}/> Ativa</label></div>
    `;

    this.abrirModal();
    this.modalCallback = () => {
      const nome = document.getElementById("m-cat-nome").value.trim();
      let id = document.getElementById("m-cat-id").value.trim();
      if (!nome) return this.toast("Informe o nome", "erro");
      if (!id) {
        id = nome
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }

      const dados = {
        id,
        nome,
        icone: document.getElementById("m-cat-icone").value.trim() || "📦",
        ordem: Number(document.getElementById("m-cat-ordem").value) || 1,
        ativo: document.getElementById("m-cat-ativo").checked,
      };

      if (isNovo) {
        if (this.dados.categorias.some((x) => x.id === id)) {
          return this.toast("ID já existe", "erro");
        }
        this.dados.categorias.push(dados);
      } else {
        const idx = this.dados.categorias.findIndex((x) => x.id === c.id);
        if (idx >= 0) this.dados.categorias[idx] = dados;
      }

      this.fecharModal();
      this.renderCategorias();
      this.renderDashboard();
      this.toast("Categoria salva", "ok");
    };
  },

  /* —— Banners —— */
  renderBanners() {
    const tbody = document.querySelector("#tabela-banners tbody");
    const lista = [...this.dados.banners].sort(
      (a, b) => (a.ordem || 0) - (b.ordem || 0)
    );

    tbody.innerHTML = lista
      .map(
        (b) => `
      <tr>
        <td><img class="thumb" src="../${b.imagem}" alt="" onerror="this.src='../assets/images/banner-placeholder.svg'"/></td>
        <td><strong>${this.esc(b.titulo)}</strong></td>
        <td>${this.esc(b.subtitulo || "")}</td>
        <td>${b.ordem || 0}</td>
        <td><span class="badge ${b.ativo !== false ? "badge-ok" : "badge-off"}">${b.ativo !== false ? "Ativo" : "Inativo"}</span></td>
        <td class="acoes">
          <button class="btn btn-outline btn-sm" data-edit-ban="${b.id}">Editar</button>
          <button class="btn btn-ghost btn-sm" data-del-ban="${b.id}" style="color:#DC2626">Excluir</button>
        </td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll("[data-edit-ban]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const b = this.dados.banners.find((x) => x.id === btn.dataset.editBan);
        this.abrirModalBanner(b);
      });
    });
    tbody.querySelectorAll("[data-del-ban]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Excluir banner?")) return;
        this.dados.banners = this.dados.banners.filter(
          (x) => x.id !== btn.dataset.delBan
        );
        this.renderBanners();
        this.renderDashboard();
      });
    });
  },

  abrirModalBanner(ban) {
    const isNovo = !ban;
    const b = ban || {
      id: "",
      titulo: "",
      subtitulo: "",
      imagem: "assets/images/banner-placeholder.svg",
      link: "",
      ativo: true,
      ordem: this.dados.banners.length + 1,
    };

    document.getElementById("modal-titulo").textContent = isNovo
      ? "Novo banner"
      : "Editar banner";
    document.getElementById("modal-body").innerHTML = `
      <div class="campo"><label>Título</label><input id="m-ban-titulo" value="${this.esc(b.titulo)}" /></div>
      <div class="campo"><label>Subtítulo / promoção</label><input id="m-ban-sub" value="${this.esc(b.subtitulo || "")}" /></div>
      <div class="campo"><label>Imagem</label><input id="m-ban-img" value="${this.esc(b.imagem)}" /></div>
      <div class="campo"><label>Link (ex: #cervejas)</label><input id="m-ban-link" value="${this.esc(b.link || "")}" /></div>
      <div class="campo"><label>Ordem</label><input type="number" id="m-ban-ordem" value="${b.ordem || 1}" /></div>
      <div class="campo check"><label><input type="checkbox" id="m-ban-ativo" ${b.ativo !== false ? "checked" : ""}/> Ativo</label></div>
    `;

    this.abrirModal();
    this.modalCallback = () => {
      const titulo = document.getElementById("m-ban-titulo").value.trim();
      if (!titulo) return this.toast("Informe o título", "erro");

      const dados = {
        id: b.id || `banner-${Date.now()}`,
        titulo,
        subtitulo: document.getElementById("m-ban-sub").value.trim(),
        imagem: document.getElementById("m-ban-img").value.trim(),
        link: document.getElementById("m-ban-link").value.trim(),
        ordem: Number(document.getElementById("m-ban-ordem").value) || 1,
        ativo: document.getElementById("m-ban-ativo").checked,
      };

      if (isNovo) this.dados.banners.push(dados);
      else {
        const idx = this.dados.banners.findIndex((x) => x.id === b.id);
        if (idx >= 0) this.dados.banners[idx] = dados;
      }

      this.fecharModal();
      this.renderBanners();
      this.renderDashboard();
      this.toast("Banner salvo", "ok");
    };
  },

  /* —— Promoções —— */
  renderPromocoes() {
    const el = document.getElementById("lista-promocoes");
    if (!el) return;
    const promos = this.dados.produtos.filter((p) => p.promocao && p.ativo !== false);

    if (!promos.length) {
      el.innerHTML = `<p class="texto-muted">Nenhum produto em promoção. Edite um produto e marque “Em promoção”.</p>`;
      return;
    }

    el.innerHTML = promos
      .map(
        (p) => `
      <div class="promo-item">
        <img src="../${p.imagem}" alt="" onerror="this.src='../assets/images/produto-placeholder.svg'"/>
        <div class="info">
          <strong>${this.esc(p.nome)}</strong>
          <span>
            <s>R$ ${Number(p.preco).toFixed(2)}</s>
            → <b style="color:#1B7A3D">R$ ${Number(p.precoPromocional ?? p.preco).toFixed(2)}</b>
          </span>
        </div>
        <button class="btn btn-outline btn-sm" data-edit-prod-promo="${p.id}">Editar</button>
      </div>`
      )
      .join("");

    el.querySelectorAll("[data-edit-prod-promo]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = this.dados.produtos.find((x) => x.id === btn.dataset.editProdPromo);
        this.abrirModalProduto(p);
      });
    });
  },

  renderCupons() {
    const tbody = document.querySelector("#tabela-cupons tbody");
    if (!tbody) return;
    const cupons = this.dados.loja?.cupons || [];

    tbody.innerHTML = cupons
      .map(
        (c, i) => `
      <tr>
        <td><strong>${this.esc(c.codigo)}</strong></td>
        <td>${c.tipo}</td>
        <td>${c.tipo === "percentual" ? c.valor + "%" : "R$ " + Number(c.valor).toFixed(2)}</td>
        <td>R$ ${Number(c.minimo || 0).toFixed(2)}</td>
        <td><span class="badge ${c.ativo ? "badge-ok" : "badge-off"}">${c.ativo ? "Ativo" : "Inativo"}</span></td>
        <td class="acoes">
          <button class="btn btn-outline btn-sm" data-edit-cupom="${i}">Editar</button>
          <button class="btn btn-ghost btn-sm" data-del-cupom="${i}" style="color:#DC2626">Excluir</button>
        </td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll("[data-edit-cupom]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.editCupom);
        this.abrirModalCupom(this.dados.loja.cupons[i], i);
      });
    });
    tbody.querySelectorAll("[data-del-cupom]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Excluir cupom?")) return;
        this.dados.loja.cupons.splice(Number(btn.dataset.delCupom), 1);
        this.renderCupons();
      });
    });
  },

  abrirModalCupom(cupom, index = null) {
    const isNovo = cupom == null;
    const c = cupom || { codigo: "", tipo: "percentual", valor: 10, minimo: 0, ativo: true };

    document.getElementById("modal-titulo").textContent = isNovo
      ? "Novo cupom"
      : "Editar cupom";
    document.getElementById("modal-body").innerHTML = `
      <div class="campo"><label>Código</label><input id="m-cup-cod" value="${this.esc(c.codigo)}" style="text-transform:uppercase" /></div>
      <div class="campo">
        <label>Tipo</label>
        <select id="m-cup-tipo">
          <option value="percentual" ${c.tipo === "percentual" ? "selected" : ""}>Percentual (%)</option>
          <option value="fixto" ${c.tipo === "fixto" ? "selected" : ""}>Valor fixo (R$)</option>
          <option value="frete" ${c.tipo === "frete" ? "selected" : ""}>Desconto no frete</option>
        </select>
      </div>
      <div class="campo-row">
        <div class="campo"><label>Valor</label><input type="number" step="0.01" id="m-cup-val" value="${c.valor}" /></div>
        <div class="campo"><label>Pedido mínimo (R$)</label><input type="number" step="0.01" id="m-cup-min" value="${c.minimo || 0}" /></div>
      </div>
      <div class="campo check"><label><input type="checkbox" id="m-cup-ativo" ${c.ativo ? "checked" : ""}/> Ativo</label></div>
    `;

    this.abrirModal();
    this.modalCallback = () => {
      const codigo = document.getElementById("m-cup-cod").value.trim().toUpperCase();
      if (!codigo) return this.toast("Informe o código", "erro");

      const dados = {
        codigo,
        tipo: document.getElementById("m-cup-tipo").value,
        valor: Number(document.getElementById("m-cup-val").value) || 0,
        minimo: Number(document.getElementById("m-cup-min").value) || 0,
        ativo: document.getElementById("m-cup-ativo").checked,
      };

      if (!this.dados.loja.cupons) this.dados.loja.cupons = [];
      if (isNovo) this.dados.loja.cupons.push(dados);
      else this.dados.loja.cupons[index] = dados;

      this.fecharModal();
      this.renderCupons();
      this.toast("Cupom salvo", "ok");
    };
  },

  /* —— Loja —— */
  renderLoja() {
    const l = this.dados.loja;
    if (!l) return;

    document.getElementById("loja-nome").value = l.nome || "";
    document.getElementById("loja-slogan").value = l.slogan || "";
    document.getElementById("loja-logo").value = l.logo || "";
    document.getElementById("loja-whatsapp").value = l.whatsapp || "";
    document.getElementById("loja-telefone").value = l.telefone || "";
    document.getElementById("loja-endereco").value = l.endereco || "";
    document.getElementById("loja-instagram").value = l.instagram || "";
    document.getElementById("loja-abertura").value = l.horarioAbertura || "08:00";
    document.getElementById("loja-fechamento").value = l.horarioFechamento || "23:59";
    document.getElementById("loja-taxa").value = l.taxaEntrega ?? 0;
    document.getElementById("loja-minimo").value = l.pedidoMinimo ?? 0;
    document.getElementById("loja-retirada").checked = !!l.retiradaBalcao;
    document.getElementById("loja-pix").checked = !!l.aceitaPix;
    document.getElementById("loja-chave-pix").value = l.chavePix || "";
    document.getElementById("loja-tipo-pix").value = l.tipoChavePix || "telefone";
    document.getElementById("loja-seo-title").value = l.seo?.title || "";
    document.getElementById("loja-seo-desc").value = l.seo?.description || "";
    document.getElementById("loja-cor-primaria").value = l.corPrimaria || "#1B7A3D";
    document.getElementById("loja-cor-destaque").value = l.corDestaque || "#FF6B00";

    this.renderBairros();
  },

  renderBairros() {
    const el = document.getElementById("lista-bairros");
    if (!el) return;
    const bairros = this.dados.loja.taxasBairro || [];

    el.innerHTML = bairros
      .map(
        (b, i) => `
      <div class="bairro-row">
        <input data-bairro-nome="${i}" value="${this.esc(b.bairro)}" placeholder="Bairro" />
        <input type="number" step="0.01" data-bairro-taxa="${i}" value="${b.taxa}" placeholder="Taxa" />
        <button type="button" class="btn btn-ghost btn-sm" data-del-bairro="${i}" style="color:#DC2626">✕</button>
      </div>`
      )
      .join("");

    el.querySelectorAll("[data-bairro-nome]").forEach((input) => {
      input.addEventListener("change", () => {
        const i = Number(input.dataset.bairroNome);
        this.dados.loja.taxasBairro[i].bairro = input.value;
      });
    });
    el.querySelectorAll("[data-bairro-taxa]").forEach((input) => {
      input.addEventListener("change", () => {
        const i = Number(input.dataset.bairroTaxa);
        this.dados.loja.taxasBairro[i].taxa = Number(input.value) || 0;
      });
    });
    el.querySelectorAll("[data-del-bairro]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.dados.loja.taxasBairro.splice(Number(btn.dataset.delBairro), 1);
        this.renderBairros();
      });
    });
  },

  lerFormLoja() {
    const l = this.dados.loja;
    l.nome = document.getElementById("loja-nome").value.trim();
    l.slogan = document.getElementById("loja-slogan").value.trim();
    l.logo = document.getElementById("loja-logo").value.trim();
    l.whatsapp = document.getElementById("loja-whatsapp").value.replace(/\D/g, "");
    l.telefone = document.getElementById("loja-telefone").value.trim();
    l.endereco = document.getElementById("loja-endereco").value.trim();
    l.instagram = document.getElementById("loja-instagram").value.trim().replace("@", "");
    l.horarioAbertura = document.getElementById("loja-abertura").value;
    l.horarioFechamento = document.getElementById("loja-fechamento").value;
    l.taxaEntrega = Number(document.getElementById("loja-taxa").value) || 0;
    l.pedidoMinimo = Number(document.getElementById("loja-minimo").value) || 0;
    l.retiradaBalcao = document.getElementById("loja-retirada").checked;
    l.aceitaPix = document.getElementById("loja-pix").checked;
    l.chavePix = document.getElementById("loja-chave-pix").value.trim();
    l.tipoChavePix = document.getElementById("loja-tipo-pix").value;
    l.seo = l.seo || {};
    l.seo.title = document.getElementById("loja-seo-title").value.trim();
    l.seo.description = document.getElementById("loja-seo-desc").value.trim();
    l.corPrimaria = document.getElementById("loja-cor-primaria").value;
    l.corDestaque = document.getElementById("loja-cor-destaque").value;
    document.getElementById("sidebar-loja-nome").textContent = l.nome;
  },

  renderConfig() {
    document.getElementById("config-usuario").value =
      this.dados.loja?.admin?.usuario || "admin";
  },

  /* —— Modal helpers —— */
  abrirModal() {
    document.getElementById("modal-bg").classList.remove("oculto");
  },

  fecharModal() {
    document.getElementById("modal-bg").classList.add("oculto");
    this.modalCallback = null;
  },

  exportar() {
    this.lerFormLoja();
    const pacote = {
      loja: this.dados.loja,
      produtos: this.dados.produtos,
      categorias: this.dados.categorias,
      banners: this.dados.banners,
    };

    const blob = new Blob([JSON.stringify(pacote, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cardapio-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
    this.toast("JSON exportado — substitua os arquivos em data/", "ok");
  },

  esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  },

  lerArquivoComoDataUrl(file, callback) {
    if (!file || !file.type.startsWith("image/")) {
      this.toast("Selecione uma imagem", "erro");
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      this.toast("Imagem muito grande (máx. 2,5 MB)", "erro");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.onerror = () => this.toast("Erro ao ler a imagem", "erro");
    reader.readAsDataURL(file);
  },
};

document.addEventListener("DOMContentLoaded", () => Admin.init());
