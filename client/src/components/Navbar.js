import React from 'react';

const Navbar = ({ setView, userRole, logout, busqueda, handleBusquedaChange }) => {
  return (
    <nav className="sticky top-0 z-50 shadow-2xl">
      {/* Barra Principal - Color Slate Oscuro Profesional */}
      <div className="bg-[#1e293b] text-white px-6 h-20 flex items-center justify-between gap-4">
        
        {/* Logo / Nombre - Texto más grande */}
        <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setView('dashboard')}>
          <div className="bg-[#00c984] p-3 rounded-2xl shadow-lg shadow-green-500/20">
             <i className="fas fa-store text-[#1e293b] text-2xl"></i>
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">MI TIENDITA</h1>
        </div>

        {/* Buscador - Letra más grande */}
        <div className="flex-1 max-w-2xl relative group hidden md:block">
          <input 
            type="text" 
            placeholder="Buscar productos..." 
            value={busqueda}
            onChange={handleBusquedaChange}
            className="w-full bg-[#334155] text-white py-4 px-6 pr-12 rounded-2xl text-xl outline-none focus:ring-4 focus:ring-[#00c984]/30 transition border border-slate-600"
          />
          <button className="absolute right-2 top-2 bg-[#00c984] text-[#1e293b] w-12 h-12 rounded-xl flex items-center justify-center">
            <i className="fas fa-search text-xl"></i>
          </button>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-6 shrink-0">
          <span className="text-sm font-bold text-slate-400 uppercase hidden lg:block">Nivel: {userRole}</span>
          <button onClick={logout} className="bg-red-500 text-white px-8 py-3 rounded-2xl text-md font-black hover:bg-red-600 transition shadow-lg uppercase">
             Salir
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;