/**
 * Histórico de pedidos finalizados (LocalStorage)
 * Compartilhado entre a loja e o painel admin no mesmo navegador/domínio
 */
const PedidosStore = {
  KEY: "cardapio_pedidos_v1",

  listar() {
    try {
      const raw = localStorage.getItem(this.KEY);
      const lista = raw ? JSON.parse(raw) : [];
      return Array.isArray(lista) ? lista : [];
    } catch {
      return [];
    }
  },

  salvarLista(lista) {
    localStorage.setItem(this.KEY, JSON.stringify(lista));
  },

  adicionar(pedido) {
    const lista = this.listar();
    const idx = lista.findIndex((x) => x.id === pedido.id);
    if (idx >= 0) {
      lista[idx] = { ...lista[idx], ...pedido };
    } else {
      lista.unshift(pedido);
    }
    if (lista.length > 300) lista.length = 300;
    this.salvarLista(lista);
    return pedido;
  },

  atualizarStatus(id, status) {
    const lista = this.listar();
    const p = lista.find((x) => x.id === id);
    if (!p) return false;
    p.status = status;
    this.salvarLista(lista);
    return true;
  },

  remover(id) {
    this.salvarLista(this.listar().filter((x) => x.id !== id));
  },

  limpar() {
    localStorage.removeItem(this.KEY);
  },
};

window.PedidosStore = PedidosStore;
