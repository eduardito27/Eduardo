const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');

const PORT = 5000;
const SECRET_KEY = "NITRO_TIENDITA_2026_JWT_SECRET";
const ADMIN_REGISTRATION_CODE = "Edutv"; 

const app = express();
const server = http.createServer(app);

// Socket.io configurado para Localhost
const io = new Server(server, { 
    cors: { origin: "http://localhost:3000", credentials: true } 
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());
app.use(morgan('dev')); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- CONEXIÓN A DB LOCAL: mi-tiendita ---
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root', 
  database: 'mi-tiendita' 
});

db.connect(err => {
  if (err) {
    console.log("❌ Error DB Local:", err.message);
  } else {
    // Corregido con comillas invertidas para que no falle la terminal
    console.log(`✅ Conectado exitosamente a la base de datos LOCAL: ${db.config.database}`);
  }
});

// Nodemailer para verificación
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'edykof85@gmail.com',
    pass: 'Eduardo230705.' 
  }
});

const registrarLog = (usuario, accion, ip) => {
    db.query('INSERT INTO logs (usuario, accion, ip_address) VALUES (?, ?, ?)', [usuario || 'Sistema', accion, ip || '0.0.0.0']);
};

const verificarToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: "Token requerido" });
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Sesión expirada" });
    req.user = decoded;
    next();
  });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage });

let sesionesActivas = {}; 
io.on('connection', (socket) => {
  socket.on('register_connection', (username) => {
    socket.username = username;
    if (!sesionesActivas[username]) sesionesActivas[username] = [];
    sesionesActivas[username].push(socket.id);
    io.emit('online_users_list', Object.keys(sesionesActivas).map(u => ({ nombre: u, sesiones: sesionesActivas[u].length })));
  });
  socket.on('disconnect', () => {
    const u = socket.username;
    if (sesionesActivas[u]) {
      sesionesActivas[u] = sesionesActivas[u].filter(id => id !== socket.id);
      if (sesionesActivas[u].length === 0) delete sesionesActivas[u];
    }
    io.emit('online_users_list', Object.keys(sesionesActivas).map(u => ({ nombre: u, sesiones: sesionesActivas[u] ? sesionesActivas[u].length : 0 })));
  });
});

// --- RUTAS DE LA API ---

app.post('/api/register', async (req, res) => {
  const { usuario, email, telefono, clave, rol, codigoAdmin } = req.body;
  let rolReal = (rol === 'admin' || rol === 'Administrador') ? 'admin' : 'user';
  if (rolReal === 'admin' && codigoAdmin !== ADMIN_REGISTRATION_CODE) return res.status(403).json({ error: "Código Admin incorrecto" });

  try {
    const hash = await bcrypt.hash(clave, 10);
    const sql = 'INSERT INTO usuarios (usuario, email, telefono, clave, rol) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [usuario, email, telefono || '', hash, rolReal], (err) => {
      if (err) return res.status(500).json({ error: "Error MySQL: " + err.sqlMessage });
      registrarLog(usuario, "REGISTRO EXITOSO", req.ip);
      res.json({ success: true });
    });
  } catch (e) { res.status(500).json({ error: "Error interno" }); }
});

app.post('/api/login', (req, res) => {
  const { usuario, clave } = req.body;
  db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], async (err, result) => {
    if (err) return res.status(500).json({error: "Error en base de datos"});
    if (result && result.length > 0) {
      const match = await bcrypt.compare(clave, result[0].clave);
      if (match) {
        const token = jwt.sign({ id: result[0].id, rol: result[0].rol, user: result[0].usuario }, SECRET_KEY, { expiresIn: '4h' });
        registrarLog(usuario, "LOGIN EXITOSO", req.ip);
        res.json({ success: true, token, user: result[0].usuario, rol: result[0].rol });
      } else res.status(401).json({ error: "Clave incorrecta" });
    } else res.status(404).json({ error: "Usuario no existe" });
  });
});

app.get('/api/productos', verificarToken, (req, res) => {
    db.query('SELECT * FROM productos', (err, r) => res.json(r));
});

app.post('/api/productos', verificarToken, upload.single('imagen'), (req, res) => {
    const { nombre, stock, precio_venta } = req.body;
    const imagen = req.file ? req.file.filename : null;
    db.query('INSERT INTO productos (nombre, imagen, stock, precio_venta, categoria) VALUES (?, ?, ?, ?, "General")', [nombre, imagen, stock, precio_venta], () => {
        registrarLog(req.user.user, `AGREGÓ: ${nombre}`, req.ip);
        res.json({ success: true });
    });
});

app.delete('/api/productos/:id', verificarToken, (req, res) => {
    if (req.user.rol !== 'admin' && req.user.user !== 'Eduardo Mtz') return res.status(403).json({ error: "No autorizado" });
    db.query('DELETE FROM productos WHERE id = ?', [req.params.id], () => {
        registrarLog(req.user.user, `BORRÓ ID: ${req.params.id}`, req.ip);
        res.json({ success: true });
    });
});

app.get('/api/stats', verificarToken, (req, res) => {
    db.query('SELECT COUNT(*) as total, IFNULL(SUM(stock*precio_venta),0) as valor, (SELECT COUNT(*) FROM productos WHERE stock < 10) as bajo FROM productos', (err, r) => {
      if(err) return res.status(500).json({error: "Error"});
      res.json({ total_productos: r[0].total, valor_inventario: r[0].valor, bajo_stock: r[0].bajo });
    });
});

app.post('/api/kick', verificarToken, (req, res) => {
  if (req.user.user !== 'Eduardo Mtz') return res.status(403).send("No autorizado");
  const { usuarioExpulsar } = req.body;
  if (sesionesActivas[usuarioExpulsar]) {
    sesionesActivas[usuarioExpulsar].forEach(sid => io.to(sid).emit('force_logout'));
    delete sesionesActivas[usuarioExpulsar];
    res.json({ success: true });
  } else res.status(404).send("Offline");
});

app.get('/api/logs', verificarToken, (req, res) => {
    if (req.user.user !== 'Eduardo Mtz') return res.status(403).send("Prohibido");
    db.query('SELECT * FROM logs ORDER BY fecha DESC LIMIT 50', (err, r) => res.json(r));
});

server.listen(PORT, () => console.log('🚀 SERVIDOR NITRO LOCAL EN PUERTO ' + PORT));