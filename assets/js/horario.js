/**
 * Horário de funcionamento da loja
 */
const Horario = {
  loja: null,

  init(loja) {
    this.loja = loja;
  },

  parseHora(str) {
    const [h, m] = String(str || "00:00").split(":").map(Number);
    return h * 60 + (m || 0);
  },

  estaAberta() {
    if (!this.loja) return false;

    const agora = new Date();
    const dia = agora.getDay();
    const dias = this.loja.diasFuncionamento || [0, 1, 2, 3, 4, 5, 6];

    if (!dias.includes(dia)) return false;

    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    const abertura = this.parseHora(this.loja.horarioAbertura);
    const fechamento = this.parseHora(this.loja.horarioFechamento);

    if (fechamento <= abertura) {
      // Ex.: 18:00 até 02:00
      return minutosAgora >= abertura || minutosAgora < fechamento;
    }

    return minutosAgora >= abertura && minutosAgora < fechamento;
  },

  textoHorario() {
    if (!this.loja) return "";
    return `${this.loja.horarioAbertura} às ${this.loja.horarioFechamento}`;
  },

  atualizarUI() {
    const aberto = this.estaAberta();
    const statusEl = document.getElementById("header-status");
    const avisoEl = document.getElementById("aviso-fechado");

    if (statusEl) {
      statusEl.className = `header-status ${aberto ? "aberto" : "fechado"}`;
      statusEl.innerHTML = `
        <span class="ponto"></span>
        ${aberto ? "Aberto" : "Fechado"}
      `;
    }

    if (avisoEl) {
      avisoEl.classList.toggle("visivel", !aberto);
      avisoEl.innerHTML = `
        <span>🔴</span>
        <span>Loja fechada no momento. Horário: ${this.textoHorario()}</span>
      `;
    }

    const btnFinalizar = document.getElementById("btn-finalizar");
    if (btnFinalizar && !aberto) {
      btnFinalizar.disabled = true;
      btnFinalizar.title = "Loja fechada";
    }

    return aberto;
  },
};

window.Horario = Horario;
