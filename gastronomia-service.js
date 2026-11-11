const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sucre_turistico_db',
    port: process.env.DB_PORT || 3306
});

const app = express();
const PORT = process.env.PORT_GASTRONOMIA || 3003; 

app.use(cors());
app.use(express.json());

// Exponer públicamente la carpeta /uploads para cargar las imágenes desde la web
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

const verificarTokenOpcional = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        req.usuario = { id: 1 };
        return next();
    }
    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
        next();
    } catch (error) {
        return res.status(401).json({ status: "error", message: "Token inválido" });
    }
};

// ==========================================
// RUTAS DE ESCRITURA
// ==========================================

const crearRestauranteHandler = async (req, res) => {
    try {
        const { nombre, municipio, tipo, tipo_comida, descripcion, direccion } = req.body;
        const tipoFinal = tipo || tipo_comida || 'Gastronomía';
        
        const archivo = req.files && req.files.length > 0 ? req.files[0] : null;
        const imagen_url = archivo ? `/uploads/${archivo.filename}` : '';

        const [result] = await db.query(
            'INSERT INTO gastronomia (nombre, municipio, tipo, direccion, descripcion, imagen_url) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, municipio, tipoFinal, direccion || '', descripcion || '', imagen_url]
        );

        res.status(201).json({ 
            status: "success", 
            message: "Restaurante registrado", 
            id: result.insertId,
            insertId: result.insertId 
        });
    } catch (error) {
        console.error("❌ Error guardando restaurante en MySQL:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

const crearPlatoHandler = async (req, res) => {
    try {
        const { restaurante_id, nombre, nombre_plato, descripcion, precio } = req.body;
        const nombreFinal = nombre || nombre_plato;
        
        const archivo = req.files && req.files.length > 0 ? req.files[0] : null;
        const imagen_url = archivo ? `/uploads/${archivo.filename}` : '';

        const [result] = await db.query(
            'INSERT INTO platos (restaurante_id, nombre, precio, descripcion, imagen_url) VALUES (?, ?, ?, ?, ?)',
            [restaurante_id, nombreFinal, precio || 0, descripcion || '', imagen_url]
        );

        res.status(201).json({ 
            status: "success", 
            message: "Plato guardado", 
            id: result.insertId,
            insertId: result.insertId 
        });
    } catch (error) {
        console.error("❌ Error guardando plato en MySQL:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

app.post(['/api/gastronomia', '/api/restaurantes'], verificarTokenOpcional, upload.any(), crearRestauranteHandler);
app.post(['/api/platos', '/api/gastronomia/platos'], verificarTokenOpcional, upload.any(), crearPlatoHandler);

// ==========================================
// RUTAS DE LECTURA (PÚBLICAS)
// ==========================================

// 1. Obtener todos los restaurantes
app.get(['/api/gastronomia', '/api/restaurantes'], async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM gastronomia ORDER BY id DESC');
        res.json({ status: "success", data: rows });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error al consultar gastronomía" });
    }
});

// 2. Obtener un restaurante por su ID y su menú de platos
const obtenerDetalleRestaurante = async (req, res) => {
    try {
        const { id } = req.params;
        const [restaurantes] = await db.query('SELECT * FROM gastronomia WHERE id = ?', [id]);
        
        if (restaurantes.length === 0) {
            return res.status(404).json({ status: "error", message: "Restaurante no encontrado" });
        }

        const [platos] = await db.query('SELECT * FROM platos WHERE restaurante_id = ?', [id]);

        const restaurante = restaurantes[0];
        restaurante.menu = platos;

        res.json({ status: "success", data: restaurante });
    } catch (error) {
        console.error("❌ Error al obtener el restaurante:", error);
        res.status(500).json({ status: "error", message: "Error al consultar la base de datos" });
    }
};

app.get(['/api/gastronomia/:id', '/api/restaurantes/:id', '/api/gastronomia/:id/menu', '/api/restaurantes/:id/menu'], obtenerDetalleRestaurante);

app.listen(PORT, () => {
    console.log(`🚀 Servidor de Gastronomía corriendo en http://localhost:${PORT}`);
});