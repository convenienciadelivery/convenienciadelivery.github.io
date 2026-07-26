/**
 * Utilitários e formatação
 */
const Utils = {
  formatarPreco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  },

  gerarId(prefixo = "id") {
    return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  },

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  escaparHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
  },

  precoFinal(produto) {
    if (
      produto.promocao &&
      produto.precoPromocional != null &&
      produto.precoPromocional < produto.preco
    ) {
      return Number(produto.precoPromocional);
    }
    return Number(produto.preco);
  },

  telefoneMask(valor) {
    const digitos = String(valor).replace(/\D/g, "").slice(0, 11);
    if (digitos.length <= 10) {
      return digitos
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return digitos
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  },

  toast(mensagem, tipo = "sucesso") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const el = document.createElement("div");
    el.className = `toast ${tipo}`;
    el.textContent = mensagem;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.3s";
      setTimeout(() => el.remove(), 300);
    }, 2500);
  },
};

window.Utils = Utils;
