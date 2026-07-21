// Agrega esto arriba de tu componente App
let searchAbortController = null; 

const buscarProductos = (texto) => {
  setBusqueda(texto);

  // 1. Cancelar petición anterior si aún está en curso (AbortController)
  if (searchAbortController) searchAbortController.abort();
  searchAbortController = new AbortController();

  // 2. Implementar Debounce manual (como pide el PDF)
  clearTimeout(window.searchTimer);
  window.searchTimer = setTimeout(async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/productos/buscar?q=${texto}`,
        { signal: searchAbortController.signal }
      );
      setProductos(res.data);
    } catch (err) {
      if (err.name !== 'CanceledError') console.error(err);
    }
  }, 500); // 500ms de espera
};