import { useState } from 'react';

function Buscador() {
  const [texto, setTexto] = useState('');
  const [productos, setProductos] = useState([]);

  const buscar = async (valor) => {
    setTexto(valor);

    if (valor.length === 0) {
      setProductos([]);
      return;
    }

    const res = await fetch(
      `http://localhost:5000/api/productos/buscar?q=${valor}`
    );
    const data = await res.json();
    setProductos(data);
  };

  return (
    <div>
      <h2>Buscar productos</h2>

      <input
        type="text"
        placeholder="Pepsi, Coca, Sabritas..."
        value={texto}
        onChange={(e) => buscar(e.target.value)}
      />

      <ul>
        {productos.map(p => (
          <li key={p.id}>
            <strong>{p.nombre}</strong> – {p.marca} | ${p.precio} | Stock: {p.stock}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Buscador;
