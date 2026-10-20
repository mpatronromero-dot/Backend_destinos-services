const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // <-- Agregado para leer el Token
require('dotenv').config();
const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

const app = express();
const PORT = 3003; 

app.use(cors());
app.use(express.json());

// ==========================================
// MIDDLEWARE DE SEGURIDAD 
// ==========================================
const verificarToken = (req, res, next) => {
    // Busca el token en la cabecera 'Authorization' enviada desde el Front-End
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extrae el token después de "Bearer "

    if (!token) return res.status(403).json({ status: "error", message: "Acceso denegado. No hay token." });

    try {
        // Verifica el token (usar la misma clave secreta que en tu auth-service)
        const decodificado = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
        req.usuario = decodificado; // Inyecta los datos del dueño (incluyendo su ID) en la petición
        next();
    } catch (error) {
        return res.status(401).json({ status: "error", message: "Token inválido o expirado" });
    }
};

// ==========================================
// RUTAS PRIVADAS (Solo para dueños logueados)
// ==========================================

// 1. Crear un Restaurante (Vinculado al usuario que inició sesión)
app.post('/api/restaurantes', verificarToken, async (req, res) => {
    try {
        const { nombre, municipio, tipo_comida, descripcion, direccion, imagen_portada } = req.body;
        const usuario_id = req.usuario.id; // Extraemos el ID del token

        const [result] = await db.query(
            'INSERT INTO restaurantes (usuario_id, nombre, municipio, tipo_comida, descripcion, direccion, imagen_portada) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [usuario_id, nombre, municipio, tipo_comida, descripcion, direccion, imagen_portada]
        );

        res.status(201).json({ status: "success", message: "Restaurante registrado", insertId: result.insertId });
    } catch (error) {
        console.error("Error guardando restaurante:", error);
        res.status(500).json({ status: "error", message: "Fallo al guardar el restaurante" });
    }
});

// 2. Agregar un Plato a la carta de un Restaurante
app.post('/api/platos', verificarToken, async (req, res) => {
    try {
        const { restaurante_id, nombre_plato, descripcion, precio, foto_url } = req.body;

        // Opcional: Validar que el restaurante_id le pertenezca a req.usuario.id antes de insertar

        const [result] = await db.query(
            'INSERT INTO platos (restaurante_id, nombre_plato, descripcion, precio, foto_url) VALUES (?, ?, ?, ?, ?)',
            [restaurante_id, nombre_plato, descripcion, precio, foto_url]
        );

        res.status(201).json({ status: "success", message: "Plato agregado al menú", insertId: result.insertId });
    } catch (error) {
        console.error("Error guardando plato:", error);
        res.status(500).json({ status: "error", message: "Fallo al guardar el plato" });
    }
});

// ==========================================
// RUTAS PÚBLICAS (Para los turistas en la web)
// ==========================================

// 3. Obtener el catálogo de restaurantes para la vista pública
app.get('/api/restaurantes', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM restaurantes ORDER BY created_at DESC');
        res.json({ status: "success", data: rows });
    } catch (error) {
        console.error("Error obteniendo restaurantes:", error);
        res.status(500).json({ status: "error", message: "Fallo al consultar la base de datos" });
    }
});

// 4. Obtener un restaurante específico con su menú de platos
app.get('/api/restaurantes/:id/menu', async (req, res) => {
    try {
        const [restaurante] = await db.query('SELECT * FROM restaurantes WHERE id = ?', [req.params.id]);
        if (restaurante.length === 0) return res.status(404).json({ status: "error", message: "Restaurante no encontrado" });

        const [platos] = await db.query('SELECT * FROM platos WHERE restaurante_id = ?', [req.params.id]);

        res.json({ 
            status: "success", 
            data: { 
                restaurante: restaurante[0], 
                menu: platos 
            } 
        });
    } catch (error) {
        console.error("Error obteniendo el menú:", error);
        res.status(500).json({ status: "error", message: "Fallo al consultar la base de datos" });
    }
});

app.listen(PORT, () => {
    console.log(` Servidor de Gastronomía (SaaS) corriendo en http://localhost:${PORT}`);
});