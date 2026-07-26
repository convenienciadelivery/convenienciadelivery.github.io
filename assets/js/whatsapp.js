/**
 * Finalização do pedido via WhatsApp
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
      <div class="linha total"><span>Total</span><span>${Utils.formatarPreco(Carrinho.total())}</span></div>
    `;
  },

  preencherBairros() {
    const select = document.getElementById("pedido-bairro");
    if (!select || !this.loja?.taxasBairro) return;

    select.innerHTML =
      `<option value="">Selecione o bairro</option>` +
      this.loja.taxasBairro
        .map(
          (b) =>
            `<option value="${Utils.escaparHtml(b.bairro)}">${Utils.escaparHtml(b.bairro)} — ${Utils.formatarPreco(b.taxa)}</option>`
        )
        .join("");
  },

  configurarRetirada() {
    const opcaoRetirada = document.getElementById("opcao-retirada");
    if (!opcaoRetirada) return;
    opcaoRetirada.style.display = this.loja?.retiradaBalcao ? "" : "none";
  },

  configurarPix() {
    const opcaoPix = document.getElementById("opcao-pix");
    const pixInfo = document.getElementById("pix-info");
    if (opcaoPix) {
      opcaoPix.style.display = this.loja?.aceitaPix ? "" : "none";
    }
    if (pixInfo && this.loja?.aceitaPix) {
      pixInfo.innerHTML = `
        <strong>PIX — ${Utils.escaparHtml(this.loja.tipoChavePix || "chave")}</strong>
        ${Utils.escaparHtml(this.loja.chavePix || "")}
      `;
    }
  },

  bindUI() {
    document
      .getElementById("modal-fechar")
      ?.addEventListener("click", () => this.fecharModal());
    document
      .getElementById("modal-pedido")
      ?.addEventListener("click", (e) => {
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

        const enderecoGrupo = document.getElementById("grupo-endereco");
        const bairroGrupo = document.getElementById("grupo-bairro");
        const isEntrega = this.tipoEntrega === "entrega";
        enderecoGrupo?.classList.toggle("oculto", !isEntrega);
        bairroGrupo?.classList.toggle("oculto", !isEntrega);

        Carrinho.renderResumo();
        this.preencherResumo();
      });
    });

    document.querySelectorAll(".pagamento-opcao").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".pagamento-opcao")
          .forEach((b) => b.classList.remove("ativo"));
        btn.classList.add("ativo");
        this.pagamento = btn.dataset.pagamento;
        document
          .getElementById("pix-info")
          ?.classList.toggle("visivel", this.pagamento === "pix");
      });
    });

    document.getElementById("pedido-bairro")?.addEventListener("change", (e) => {
      Carrinho.bairroSelecionado = e.target.value || null;
      Carrinho.renderResumo();
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
      campos.push({ id: "pedido-endereco", msg: "Informe o endereço" });
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
          `• ${i.nome} x${i.quantidade} — ${Utils.formatarPreco(i.preco * i.quantidade)}`
      )
      .join("\n");

    const tipoTxt =
      this.tipoEntrega === "retirada" ? "🏪 Retirada no balcão" : "🛵 Entrega";

    const pagMap = {
      pix: "PIX",
      dinheiro: "Dinheiro",
      cartao: "Cartão na entrega",
    };

    let msg = `🛒 *NOVO PEDIDO*\n`;
    msg += `━━━━━━━━━━━━━━\n\n`;
    msg += `👤 *Cliente:*\n${nome}\n`;
    msg += `📱 *Telefone:*\n${telefone}\n\n`;
    msg += `📦 *Tipo:*\n${tipoTxt}\n\n`;

    if (this.tipoEntrega === "entrega") {
      msg += `📍 *Endereço:*\n${endereco}`;
      if (bairro) msg += `\nBairro: ${bairro}`;
      msg += `\n\n`;
    }

    msg += `🛍️ *Produtos:*\n${linhasProdutos}\n\n`;
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

    msg += `\n💰 *TOTAL: ${Utils.formatarPreco(Carrinho.total())}*\n`;
    msg += `💳 Pagamento: ${pagMap[this.pagamento] || this.pagamento}\n`;

    if (this.pagamento === "pix" && this.loja?.chavePix) {
      msg += `Chave PIX: ${this.loja.chavePix}\n`;
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
      Utils.toast("Preencha os campos obrigatórios", "erro");
      return;
    }

    const whatsapp = String(this.loja?.whatsapp || "").replace(/\D/g, "");
    if (!whatsapp) {
      Utils.toast("WhatsApp da loja não configurado", "erro");
      return;
    }

    const mensagem = encodeURIComponent(this.montarMensagem());
    const url = `https://wa.me/${whatsapp}?text=${mensagem}`;

    window.open(url, "_blank");

    Utils.toast("Redirecionando para o WhatsApp...");
    this.fecharModal();

    // Limpa carrinho após envio
    setTimeout(() => {
      Carrinho.limpar();
    }, 800);
  },
};

window.WhatsApp = WhatsApp;
