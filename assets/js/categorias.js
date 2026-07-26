/**
 * Gerenciamento de categorias
 */
const Categorias = {
  lista: [],
  ativa: "todas",

  init(categorias) {
    this.lista = (categorias || [])
      .filter((c) => c.ativo !== false)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    this.render();
  },

  render() {
    const container = document.getElementById("categorias-lista");
    if (!container) return;

    const chips = [
      {
        id: "todas",
        nome: "Todos",
        icone: "🏠",
      },
      ...this.lista,
    ];

    container.innerHTML = chips
      .map(
        (cat) => `
      <button
        class="categoria-chip ${this.ativa === cat.id ? "ativo" : ""}"
        data-categoria="${cat.id}"
        type="button"
        aria-label="Categoria ${Utils.escaparHtml(cat.nome)}"
      >
        <span class="icone">${cat.icone || "📦"}</span>
        <span class="nome">${Utils.escaparHtml(cat.nome)}</span>
      </button>
    `
      )
      .join("");

    container.querySelectorAll(".categoria-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selecionar(btn.dataset.categoria);
      });
    });
  },

  selecionar(id) {
    this.ativa = id;
    this.render();

    const busca = document.getElementById("pesquisa-input");
    if (busca) busca.value = "";
    document.getElementById("pesquisa-limpar")?.classList.remove("visivel");

    if (window.Produtos) {
      Produtos.filtrar({ categoria: id === "todas" ? null : id, busca: "" });
    }

    // Scroll suave até produtos
    document.getElementById("produtos-secao")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  },

  obter(id) {
    return this.lista.find((c) => c.id === id);
  },

  nome(id) {
    return this.obter(id)?.nome || id;
  },
};

window.Categorias = Categorias;
