/**
 * App principal — carrega dados SEM precisar de servidor
 * Ordem: LocalStorage (admin) → CARDAPIO_DATA (data/*.js) → fetch JSON (opcional)
 */
const App = {
  STORAGE_PREFIX: "cardapio_admin_",

  async init() {
    try {
      const [loja, produtos, categorias, banners] = await Promise.all([
        this.carregarDados("loja"),
        this.carregarDados("produtos"),
        this.carregarDados("categorias"),
        this.carregarDados("banners"),
      ]);

      this.aplicarTema(loja);
      this.aplicarSEO(loja);
      this.renderHeader(loja);
      this.renderFooter(loja);

      Horario.init(loja);
      Horario.atualizarUI();
      setInterval(() => Horario.atualizarUI(), 60000);

      Categorias.init(categorias);
      Produtos.init(produtos);
      Banner.init(banners);
      Carrinho.init(loja);
      WhatsApp.init(loja);
      PWA.init();

      this.bindPesquisa();
      this.bindHashCategoria();

      document.getElementById("loading")?.classList.add("oculto");
      document.getElementById("app-conteudo")?.classList.remove("oculto");
    } catch (erro) {
      console.error("Erro ao iniciar app:", erro);
      const loading = document.getElementById("loading");
      if (loading) {
        loading.innerHTML = `
          <p style="color:#DC2626;font-weight:700;">Erro ao carregar o cardápio.</p>
          <p style="font-size:0.875rem;margin-top:8px;">Abra a pasta do projeto e dê duplo clique em index.html</p>
          <button onclick="location.reload()" style="margin-top:16px;padding:10px 20px;background:#1B7A3D;color:#fff;border-radius:999px;font-weight:700;">Recarregar</button>
        `;
      }
    }
  },

  async carregarDados(tipo) {
    // 1) Alterações do painel admin (LocalStorage)
    const local = localStorage.getItem(this.STORAGE_PREFIX + tipo);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        /* continua */
      }
    }

    // 2) Dados embutidos em data/*.js (funciona sem servidor / file://)
    if (window.CARDAPIO_DATA && window.CARDAPIO_DATA[tipo] != null) {
      return window.CARDAPIO_DATA[tipo];
    }

    // 3) Fallback fetch (GitHub Pages / servidor local)
    try {
      const url =
        (typeof assetUrl === "function"
          ? assetUrl(`data/${tipo}.json`)
          : `data/${tipo}.json`) + `?v=${Date.now()}`;
      const resp = await fetch(url);
      if (resp.ok) return resp.json();
    } catch {
      /* file:// ou offline */
    }

    throw new Error(`Dados não encontrados: ${tipo}`);
  },

  aplicarTema(loja) {
    if (loja.corPrimaria) {
      document.documentElement.style.setProperty("--cor-primaria", loja.corPrimaria);
    }
    if (loja.corSecundaria) {
      document.documentElement.style.setProperty(
        "--cor-primaria-escura",
        loja.corSecundaria
      );
    }
    if (loja.corDestaque) {
      document.documentElement.style.setProperty("--cor-destaque", loja.corDestaque);
    }
  },

  aplicarSEO(loja) {
    const seo = loja.seo || {};
    document.title = seo.title || loja.nome || "Cardápio Digital";

    this.setMeta("description", seo.description || loja.slogan || "");
    this.setMeta("keywords", seo.keywords || "");
    this.setMeta("og:title", seo.title || loja.nome, "property");
    this.setMeta("og:description", seo.description || loja.slogan || "", "property");
    this.setMeta("og:type", "website", "property");
    this.setMeta("og:image", loja.logo || "", "property");
    this.setMeta("twitter:card", "summary");
    this.setMeta("twitter:title", seo.title || loja.nome);
    this.setMeta("twitter:description", seo.description || loja.slogan || "");

    const favicon = document.querySelector("link[rel='icon']");
    if (favicon && loja.favicon) favicon.href = loja.favicon;
  },

  setMeta(name, content, attr = "name") {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  },

  renderHeader(loja) {
    const logo = document.getElementById("header-logo");
    const nome = document.getElementById("header-nome");
    const wa = document.getElementById("header-whatsapp");
    if (logo) {
      logo.src = loja.logo || "assets/images/logo.svg";
      logo.alt = loja.nome || "Logo";
    }
    if (nome) nome.textContent = loja.nome || "Minha Loja";
    if (wa) {
      const num = String(loja.whatsapp || "").replace(/\D/g, "");
      wa.href = num ? `https://wa.me/${num}` : "#";
    }
  },

  renderFooter(loja) {
    const logo = document.getElementById("footer-logo");
    const nome = document.getElementById("footer-nome");
    const slogan = document.getElementById("footer-slogan");
    const endereco = document.getElementById("footer-endereco");
    const telefone = document.getElementById("footer-telefone");
    const horario = document.getElementById("footer-horario");
    const instagram = document.getElementById("footer-instagram");

    if (logo) logo.src = loja.logo || "assets/images/logo.svg";
    if (nome) nome.textContent = loja.nome || "";
    if (slogan) slogan.textContent = loja.slogan || "";
    if (endereco) endereco.textContent = loja.endereco || "";
    if (telefone) {
      telefone.textContent = loja.telefone || "";
      telefone.href = `https://wa.me/${String(loja.whatsapp || "").replace(/\D/g, "")}`;
    }
    if (horario) {
      horario.textContent = `Horário: ${loja.horarioAbertura} às ${loja.horarioFechamento}`;
    }
    if (instagram && loja.instagram) {
      instagram.href = `https://instagram.com/${loja.instagram}`;
      instagram.classList.remove("oculto");
    }
  },

  bindPesquisa() {
    const input = document.getElementById("pesquisa-input");
    const limpar = document.getElementById("pesquisa-limpar");

    const buscar = Utils.debounce((valor) => {
      Categorias.ativa = "todas";
      Categorias.render();
      Produtos.filtrar({ categoria: null, busca: valor });
    }, 250);

    input?.addEventListener("input", () => {
      const valor = input.value;
      limpar?.classList.toggle("visivel", valor.length > 0);
      buscar(valor);
    });

    limpar?.addEventListener("click", () => {
      if (input) input.value = "";
      limpar.classList.remove("visivel");
      Produtos.filtrar({ categoria: null, busca: "" });
      Categorias.ativa = "todas";
      Categorias.render();
    });
  },

  bindHashCategoria() {
    const hash = location.hash.replace("#", "");
    if (hash && hash !== "todas") {
      setTimeout(() => Categorias.selecionar(hash), 300);
    }
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
