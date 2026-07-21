import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Navbar from "./components/Navbar";

// Conectado al servidor local
const socket = io('http://localhost:5000');

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'user');
  const [usuario, setUsuario] = useState(localStorage.getItem('user') || '');
  
  const [authMode, setAuthMode] = useState('login'); 
  const [cred, setCred] = useState({ u: '', p: '', e: '', t: '', code: '' });
  const [nuevoRol, setNuevoRol] = useState('user');

  const [view, setView] = useState('dashboard');
  const [stats, setStats] = useState({ total_productos: 0, valor_inventario: 0, bajo_stock: 0 });
  const [productos, setProductos] = useState([]);
  const [logs, setLogs] = useState([]); 
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [filtroBajo, setFiltroBajo] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nuevoProd, setNuevoProd] = useState({ n: '', s: '', p: '', f: null });
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Configurado para LOCALHOST
  const api = useMemo(() => axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setToken('');
    setIsLoggedIn(false);
    setAuthMode('login');
    window.location.reload(); 
  }, []);

  useEffect(() => {
    if (isLoggedIn && usuario) {
      socket.emit('register_connection', usuario);
      socket.on('online_users_list', (list) => setOnlineUsers(list));
      socket.on('force_logout', () => {
        alert("🚨 SESIÓN FINALIZADA POR EL DUEÑO");
        handleLogout();
      });
    }
    return () => { socket.off('online_users_list'); socket.off('force_logout'); };
  }, [isLoggedIn, usuario, handleLogout]);

  const cargarDatos = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const [resS, resP] = await Promise.all([api.get('/stats'), api.get('/productos')]);
      setStats(resS.data);
      setProductos(resP.data);
      if (usuario === 'Eduardo Mtz') {
          const resL = await api.get('/logs');
          setLogs(resL.data);
      }
    } catch (e) { if (e.response?.status === 401) handleLogout(); }
    finally { setLoading(false); }
  }, [isLoggedIn, api, handleLogout, usuario]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const login = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/login', { 
        usuario: cred.u, clave: cred.p 
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.rol);
      localStorage.setItem('user', res.data.user);
      setToken(res.data.token);
      setUserRole(res.data.rol);
      setUsuario(res.data.user);
      setIsLoggedIn(true);
    } catch (e) { alert("Credenciales incorrectas"); }
  };

  const registrar = async () => {
    try {
      // CORREGIDO PARA LOCALHOST
      await axios.post('http://localhost:5000/api/register', { 
        usuario: cred.u, email: cred.e, telefono: cred.t, clave: cred.p, rol: nuevoRol, codigoAdmin: cred.code 
      });
      alert("¡Usuario creado!"); 
      setAuthMode('login');
    } catch (e) { 
        alert("Error: " + (e.response?.data?.error || "Revisa terminal")); 
    }
  };

  const guardar = async () => {
    const fd = new FormData();
    fd.append('nombre', nuevoProd.n); fd.append('stock', nuevoProd.s); fd.append('precio_venta', nuevoProd.p);
    if (nuevoProd.f) fd.append('imagen', nuevoProd.f);
    await api.post('/productos', fd);
    setShowForm(false); cargarDatos();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#bdc3c7] flex items-center justify-center p-4 text-white">
        <div className="bg-[#2d333b] p-10 rounded-[40px] shadow-2xl w-full max-w-sm border border-gray-700">
          <h2 className="text-3xl font-black text-center mb-6 uppercase italic tracking-tighter">Mi Tiendita Pro</h2>
          <div className="space-y-3">
            <input className="w-full bg-[#444c56] p-4 rounded-2xl outline-none" placeholder="Usuario" onChange={e => setCred({...cred, u: e.target.value})} />
            {authMode === 'register' && (
              <>
                <input className="w-full bg-[#444c56] p-4 rounded-2xl outline-none" placeholder="Email" onChange={e => setCred({...cred, e: e.target.value})} />
                <select className="w-full bg-[#444c56] p-4 rounded-2xl outline-none" value={nuevoRol} onChange={e => setNuevoRol(e.target.value)}>
                   <option value="user">Vendedor</option>
                   <option value="admin">Administrador</option>
                </select>
                {nuevoRol === 'admin' && <input className="w-full bg-red-900/20 p-4 rounded-2xl border border-red-500 outline-none font-bold" placeholder="CÓDIGO ADMIN: Edutv" onChange={e => setCred({...cred, code: e.target.value})} />}
              </>
            )}
            <input type="password" title="pass" className="w-full bg-[#444c56] p-4 rounded-2xl outline-none" placeholder="Contraseña" onChange={e => setCred({...cred, p: e.target.value})} />
            <button className="w-full bg-[#00c984] text-[#1e293b] font-black py-4 rounded-3xl text-lg uppercase transition active:scale-95 shadow-lg" onClick={authMode === 'login' ? login : registrar}>{authMode}</button>
            <p className="text-[10px] text-center text-gray-400 font-bold uppercase cursor-pointer" onClick={() => setAuthMode(authMode==='login'?'register':'login')}>{authMode==='login'?'Crear Cuenta':'Regresar'}</p>
          </div>
        </div>
      </div>
    );
  }

  const filtrados = productos.filter(p => (filtroBajo ? p.stock < 10 : true) && p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <Navbar setView={setView} userRole={userRole} logout={handleLogout} busqueda={busqueda} handleBusquedaChange={e => {setBusqueda(e.target.value);}} />
      <main className="max-w-7xl mx-auto p-4 md:p-12">
        {usuario === 'Eduardo Mtz' && (
          <div className="space-y-6 mb-12 animate-in slide-in-from-top duration-700 font-sans">
            <div className="p-8 bg-[#1e293b] rounded-[50px] text-white shadow-2xl border-b-8 border-[#00c984]">
                <h3 className="text-xl font-black uppercase mb-6 text-[#00c984] italic">Super Monitor</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {onlineUsers.filter(u => u.nombre !== usuario).map(u => (
                    <div key={u.nombre} className="bg-slate-800 p-6 rounded-[30px] flex justify-between items-center border border-slate-700">
                        <div><p className="font-black uppercase">{u.nombre}</p><p className="text-[9px] text-[#00c984] font-bold">{u.sesiones} CONEXIONES</p></div>
                        <button onClick={() => api.post('/kick', { usuarioExpulsar: u.nombre })} className="bg-red-500 text-[9px] px-4 py-2 rounded-full font-black uppercase">KICK</button>
                    </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {view === "dashboard" && busqueda === "" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div onClick={() => {setView('inv'); setFiltroBajo(false)}} className="bg-white p-10 border rounded-[50px] shadow-xl text-center cursor-pointer hover:scale-105 transition border-slate-100">
              <p className="text-xs text-gray-400 font-black uppercase mb-2 italic">Stock</p>
              <p className="text-6xl font-black text-[#1e293b]">{stats.total_productos}</p>
            </div>
            <div onClick={() => {setView('inv'); setFiltroBajo(true)}} className="bg-white p-10 border rounded-[50px] shadow-xl text-center cursor-pointer hover:scale-105 transition">
              <p className="text-xs text-red-400 font-black uppercase mb-2 italic underline tracking-tighter">Bajo Stock</p>
              <p className="text-6xl font-black text-red-500">{stats.bajo_stock}</p>
            </div>
            <div className="bg-white p-10 border rounded-[50px] shadow-xl text-center border-slate-100 text-green-600 font-black">
              <p className="text-xs text-green-400 uppercase mb-2 italic">Capital Real</p>
              <p className="text-4xl md:text-5xl font-black">${stats.valor_inventario.toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">{busqueda ? `Resultados: ${busqueda}` : "Inventario"}</h2>
              <button onClick={() => setShowForm(!showForm)} className="bg-[#1e293b] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-lg"> {showForm ? 'Cerrar' : '+ Agregar'} </button>
            </div>
            {showForm && (
              <div className="bg-white p-6 rounded-[40px] border-4 border-dashed grid grid-cols-1 md:grid-cols-5 gap-4 shadow-inner">
                <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Nombre" onChange={e => setNuevoProd({...nuevoProd, n: e.target.value})} />
                <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Stock" type="number" onChange={e => setNuevoProd({...nuevoProd, s: e.target.value})} />
                <input className="p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Precio" type="number" onChange={e => setNuevoProd({...nuevoProd, p: e.target.value})} />
                <input type="file" className="text-[10px] mt-4 shadow-sm" onChange={e => setNuevoProd({...nuevoProd, f: e.target.files[0]})} />
                <button className="bg-[#00c984] text-[#1e293b] font-black rounded-2xl py-4 uppercase shadow-lg" onClick={guardar}>GUARDAR</button>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center font-sans">
              {filtrados.map(p => (
                <div key={p.id} className="bg-white p-4 md:p-6 rounded-[30px] md:rounded-[40px] shadow-xl border border-gray-100 relative group transition hover:border-[#00c984]">
                  {/* IMAGEN CORREGIDA PARA LOCALHOST */}
                  <img src={p.imagen ? `http://localhost:5000/uploads/${p.imagen}` : 'https://via.placeholder.com/150'} className="w-full h-32 md:h-40 object-cover rounded-3xl mb-4 shadow-sm" alt="p" />
                  <h3 className="font-black uppercase text-[10px] md:text-sm mb-1 line-clamp-1">{p.nombre}</h3>
                  <p className="text-green-600 font-black text-xl md:text-2xl">${p.precio_venta}</p>
                  {(userRole === 'admin' || usuario === 'Eduardo Mtz') && (
                    <button onClick={() => api.delete(`/productos/${p.id}`).then(()=>cargarDatos())} className="absolute top-2 right-2 text-red-300 hover:text-red-600 transition"><i className="fas fa-trash"></i></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;