/**
 * Finalização do pedido via WhatsApp
 * Pagamento: somente PIX
 */
const WhatsApp = {
  loja: null,
  tipoEntrega: "entrega",
  pagamento: "pix",

  init(loja) {
    this.loja = loja;
    this.bindUI();
  },

  abrirModal() {
    const overlay = document.getElementById("modal-pedido");
    if (!overlay) return;

    this.tipoEntrega = "entrega";
    Carrinho.tipoEntrega = "entrega";
    document.querySelectorAll(".tipo-entrega-opcao").forEach((b) => {
      b.classList.toggle("ativo", b.dataset.tipo === "entrega");
    });
    document.getElementById("grupo-endereco")?.classList.remove("oculto");
    document.getElementById("grupo-bairro")?.classList.remove("oculto");

    this.preencherItens();
    this.preencherResumo();
    this.preencherBairros();
    this.configurarRetirada();
    this.configurarPix();

    overlay.classList.add("aberto");
    document.body.style.overflow = "hidden";
  },

  fecharModal() {
    document.getElementById("modal-pedido")?.classList.remove("aberto");
    document.body.style.overflow = "";
  },

  preencherItens() {
    const el = document.getElementById("pedido-itens-lista");
    if (!el) return;

    el.innerHTML = Carrinho.itens
      .map(
        (i) => `
      <div class="pedido-item-linha">
        <img src="${Utils.escaparHtml(i.imagem)}" alt="" onerror="this.src='assets/images/produto-placeholder.svg'" />
        <div class="info">
          <strong>${Utils.escaparHtml(i.nome)}</strong>
          <span>${i.quantidade}x · ${Utils.formatarPreco(i.preco)} cada</span>
        </div>
        <div class="valor">${Utils.formatarPreco(i.preco * i.quantidade)}</div>
      </div>`
      )
      .join("");
  },

  preencherResumo() {
    const el = document.getElementById("resumo-pedido-modal");
    if (!el) return;
    el.innerHTML = `
      <div class="linha"><span>Subtotal</span><span>${Utils.formatarPreco(Carrinho.subtotal())}</span></div>
      <div class="linha"><span>Entrega</span><span id="modal-taxa-entrega">${
        Carrinho.tipoEntrega === "retirada"
          ? "Grátis"
          : Utils.formatarPreco(Carrinho.taxaEntrega())
      }</span></div>
      ${
        Carrinho.desconto() > 0
          ? `<div class="linha"><span>Desconto</span><span>- ${Utils.formatarPreco(Carrinho.desconto())}</span></div>`
          : ""
      }
      <div class="linha total"><span>Total a pagar no PIX</span><span>${Utils.formatarPreco(Carrinho.total())}</span></div>
    `;
  },

  preencherBairros() {
    const select = document.getElementById("pedido-bairro");
    if (!select || !this.loja?.taxasBairro) return;

    select.innerHTML =
      `<option value="">Taxa padrão de entrega</option>` +
      this.loja.taxasBairro
        .map(
          (b) =>
            `<option value="${Utils.escaparHtml(b.bairro)}">${Utils.escaparHtml(b.bairro)} — ${Utils.formatarPreco(b.taxa)}</option>`
        )
        .join("");
  },

  configurarRetirada() {
    const opcaoRetirada = document.getElementById("opcao-retirada");
    const wrap = document.getElementById("tipo-entrega-wrap");
    if (!this.loja?.retiradaBalcao) {
      if (wrap) wrap.style.display = "none";
      return;
    }
    if (wrap) wrap.style.display = "";
    if (opcaoRetirada) opcaoRetirada.style.display = "";
  },

  configurarPix() {
    const pixInfo = document.getElementById("pix-info");
    if (!pixInfo) return;
    const chave = this.loja?.chavePix || "Configure a chave PIX no admin";
    const tipo = this.loja?.tipoChavePix || "chave";
    pixInfo.innerHTML = `Chave PIX (${Utils.escaparHtml(tipo)}): <strong>${Utils.escaparHtml(chave)}</strong>`;
  },

  bindUI() {
    document
      .getElementById("modal-fechar")
      ?.addEventListener("click", () => this.fecharModal());
    document.getElementById("modal-pedido")?.addEventListener("click", (e) => {
      if (e.target.id === "modal-pedido") this.fecharModal();
    });

    document.querySelectorAll(".tipo-entrega-opcao").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".tipo-entrega-opcao")
          .forEach((b) => b.classList.remove("ativo"));
        btn.classList.add("ativo");
        this.tipoEntrega = btn.dataset.tipo;
        Carrinho.tipoEntrega = this.tipoEntrega;

        const isEntrega = this.tipoEntrega === "entrega";
        document.getElementById("grupo-endereco")?.classList.toggle("oculto", !isEntrega);
        document.getElementById("grupo-bairro")?.classList.toggle("oculto", !isEntrega);

        Carrinho.render();
        this.preencherResumo();
      });
    });

    document.getElementById("pedido-bairro")?.addEventListener("change", (e) => {
      Carrinho.bairroSelecionado = e.target.value || null;
      Carrinho.render();
      this.preencherResumo();
    });

    document.getElementById("pedido-telefone")?.addEventListener("input", (e) => {
      e.target.value = Utils.telefoneMask(e.target.value);
    });

    document
      .getElementById("btn-enviar-pedido")
      ?.addEventListener("click", () => this.enviar());
  },

  validar() {
    let ok = true;
    const campos = [
      { id: "pedido-nome", msg: "Informe seu nome" },
      { id: "pedido-telefone", msg: "Informe seu telefone" },
    ];

    if (this.tipoEntrega === "entrega") {
      campos.push({ id: "pedido-endereco", msg: "Informe o endereço de entrega" });
    }

    campos.forEach(({ id, msg }) => {
      const grupo = document.getElementById(id)?.closest(".form-grupo");
      const input = document.getElementById(id);
      const valor = input?.value.trim();
      if (!valor) {
        grupo?.classList.add("erro");
        const erro = grupo?.querySelector(".erro-campo");
        if (erro) erro.textContent = msg;
        ok = false;
      } else {
        grupo?.classList.remove("erro");
      }
    });

    return ok;
  },

  montarMensagem() {
    const nome = document.getElementById("pedido-nome")?.value.trim() || "";
    const telefone = document.getElementById("pedido-telefone")?.value.trim() || "";
    const endereco = document.getElementById("pedido-endereco")?.value.trim() || "";
    const bairro = document.getElementById("pedido-bairro")?.value || "";
    const obs = document.getElementById("pedido-obs")?.value.trim() || "";

    const linhasProdutos = Carrinho.itens
      .map(
        (i) =>
          `• ${i.nome}\n  Qtd: ${i.quantidade} × ${Utils.formatarPreco(i.preco)} = ${Utils.formatarPreco(i.preco * i.quantidade)}`
      )
      .join("\n\n");

    const tipoTxt =
      this.tipoEntrega === "retirada" ? "🏪 Retirada no balcão" : "🛵 Entrega";

    let msg = `🛒 *NOVO PEDIDO*\n`;
    msg += `━━━━━━━━━━━━━━\n\n`;
    msg += `👤 *Cliente:*\n${nome}\n\n`;
    msg += `📱 *Telefone:*\n${telefone}\n\n`;
    msg += `📦 *Tipo:*\n${tipoTxt}\n\n`;

    if (this.tipoEntrega === "entrega") {
      msg += `📍 *Endereço:*\n${endereco}`;
      if (bairro) msg += `\nBairro: ${bairro}`;
      msg += `\n\n`;
    }

    msg += `🛍️ *Itens do pedido:*\n\n${linhasProdutos}\n\n`;
    msg += `━━━━━━━━━━━━━━\n`;
    msg += `Subtotal: ${Utils.formatarPreco(Carrinho.subtotal())}\n`;
    msg += `Entrega: ${
      this.tipoEntrega === "retirada"
        ? "Grátis (retirada)"
        : Utils.formatarPreco(Carrinho.taxaEntrega())
    }\n`;

    if (Carrinho.desconto() > 0) {
      msg += `Desconto (${Carrinho.cupom?.codigo}): -${Utils.formatarPreco(Carrinho.desconto())}\n`;
    }

    msg += `\n💰 *TOTAL: ${Utils.formatarPreco(Carrinho.total())}*\n\n`;
    msg += `💳 *Pagamento: SOMENTE PIX*\n`;
    if (this.loja?.chavePix) {
      msg += `Chave PIX (${this.loja.tipoChavePix || "chave"}): ${this.loja.chavePix}\n`;
    }

    if (obs) {
      msg += `\n📝 *Observação:*\n${obs}\n`;
    }

    msg += `\n━━━━━━━━━━━━━━\n_Pedido via Cardápio Digital_`;

    return msg;
  },

  enviar() {
    if (!Horario.estaAberta()) {
      Utils.toast("Loja fechada no momento", "erro");
      return;
    }

    if (!this.validar()) {
      Utils.toast("Preencha nome e endereço", "erro");
      return;
    }

    const whatsapp = String(this.loja?.whatsapp || "").replace(/\D/g, "");
    if (!whatsapp) {
      Utils.toast("WhatsApp da loja não configurado no admin", "erro");
      return;
    }

    const mensagem = encodeURIComponent(this.montarMensagem());
    const url = `https://wa.me/${whatsapp}?text=${mensagem}`;

    this.salvarPedidoNoHistorico();

    window.open(url, "_blank");

    Utils.toast("Pedido salvo e enviado ao WhatsApp");
    this.fecharModal();

    setTimeout(() => {
      Carrinho.limpar();
    }, 800);
  },

  salvarPedidoNoHistorico() {
    if (!window.PedidosStore) return;

    const nome = document.getElementById("pedido-nome")?.value.trim() || "";
    const telefone = document.getElementById("pedido-telefone")?.value.trim() || "";
    const telefoneDigits = telefone.replace(/\D/g, "");
    const endereco = document.getElementById("pedido-endereco")?.value.trim() || "";
    const bairro = document.getElementById("pedido-bairro")?.value || "";
    const obs = document.getElementById("pedido-obs")?.value.trim() || "";

    const pedido = {
      id: `ped_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      dataHora: new Date().toISOString(),
      nome,
      telefone,
      telefoneDigits,
      endereco: this.tipoEntrega === "entrega" ? endereco : "",
      bairro: this.tipoEntrega === "entrega" ? bairro : "",
      tipoEntrega: this.tipoEntrega,
      observacao: obs,
      itens: Carrinho.itens.map((i) => ({
        id: i.id,
        nome: i.nome,
        quantidade: i.quantidade,
        preco: i.preco,
        imagem: i.imagem,
        subtotal: i.preco * i.quantidade,
      })),
      subtotal: Carrinho.subtotal(),
      entrega: Carrinho.taxaEntrega(),
      desconto: Carrinho.desconto(),
      cupom: Carrinho.cupom?.codigo || null,
      total: Carrinho.total(),
      pagamento: "PIX",
      chavePix: this.loja?.chavePix || "",
      status: "novo",
    };

    PedidosStore.adicionar(pedido);

    // Em file:// o admin não compartilha LocalStorage com a loja —
    // baixa um JSON para importar no painel se precisar.
    if (location.protocol === "file:") {
      try {
        const blob = new Blob([JSON.stringify(pedido, null, 2)], {
          type: "application/json",
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `pedido-${pedido.nome.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch {
        /* ignore */
      }
    }
  },
};

window.WhatsApp = WhatsApp;
