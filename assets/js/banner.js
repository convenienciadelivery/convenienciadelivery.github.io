/**
 * Banner / slider automático
 */
const Banner = {
  banners: [],
  indice: 0,
  timer: null,
  intervalo: 4500,

  init(banners) {
    this.banners = (banners || [])
      .filter((b) => b.ativo !== false)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

    if (!this.banners.length) {
      document.getElementById("banner-secao")?.classList.add("oculto");
      return;
    }

    this.render();
    this.iniciarAutoplay();
  },

  render() {
    const track = document.getElementById("banner-track");
    const dots = document.getElementById("banner-dots");
    if (!track) return;

    track.innerHTML = this.banners
      .map(
        (b) => `
      <div class="banner-slide" data-link="${Utils.escaparHtml(b.link || "")}">
        <img src="${Utils.escaparHtml(b.imagem)}" alt="${Utils.escaparHtml(b.titulo)}" onerror="this.src='assets/images/banner-placeholder.svg'" />
        <div class="banner-conteudo">
          <h2>${Utils.escaparHtml(b.titulo)}</h2>
          <p>${Utils.escaparHtml(b.subtitulo || "")}</p>
        </div>
      </div>
    `
      )
      .join("");

    if (dots) {
      dots.innerHTML = this.banners
        .map(
          (_, i) =>
            `<button class="banner-dot ${i === 0 ? "ativo" : ""}" data-dot="${i}" type="button" aria-label="Banner ${i + 1}"></button>`
        )
        .join("");

      dots.querySelectorAll(".banner-dot").forEach((dot) => {
        dot.addEventListener("click", () => {
          this.irPara(Number(dot.dataset.dot));
          this.reiniciarAutoplay();
        });
      });
    }

    track.querySelectorAll(".banner-slide").forEach((slide) => {
      slide.addEventListener("click", () => {
        const link = slide.dataset.link;
        if (!link) return;
        if (link.startsWith("#")) {
          const catId = link.slice(1);
          if (catId && window.Categorias) Categorias.selecionar(catId);
        }
      });
    });

    document.getElementById("banner-prev")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.anterior();
      this.reiniciarAutoplay();
    });
    document.getElementById("banner-next")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.proximo();
      this.reiniciarAutoplay();
    });
  },

  irPara(i) {
    this.indice = i;
    const track = document.getElementById("banner-track");
    if (track) track.style.transform = `translateX(-${i * 100}%)`;

    document.querySelectorAll(".banner-dot").forEach((dot, idx) => {
      dot.classList.toggle("ativo", idx === i);
    });
  },

  proximo() {
    this.irPara((this.indice + 1) % this.banners.length);
  },

  anterior() {
    this.irPara((this.indice - 1 + this.banners.length) % this.banners.length);
  },

  iniciarAutoplay() {
    this.pararAutoplay();
    if (this.banners.length < 2) return;
    this.timer = setInterval(() => this.proximo(), this.intervalo);
  },

  reiniciarAutoplay() {
    this.iniciarAutoplay();
  },

  pararAutoplay() {
    if (this.timer) clearInterval(this.timer);
  },
};

window.Banner = Banner;
