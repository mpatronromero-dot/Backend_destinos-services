const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

const app = express();
const PORT = 3006;

app.use(cors());
app.use(express.json());

// 1. Configurar subida de afiches (Imágenes)
const dir = './uploads';
if (!fs.existsSync(dir)){ fs.mkdirSync(dir); }
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/') },
    filename: function (req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)) }
});
// Usamos upload.any() para evitar conflictos con el nombre del input de archivo
const upload = multer({ storage: storage });

// 2. Ruta GET: Obtener todos los eventos ordenados por fecha más próxima
app.get('/api/eventos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM eventos ORDER BY fecha_inicio ASC');
        res.json(rows);
    } catch (error) {
        console.error("Error obteniendo eventos:", error);
        res.status(500).json({ message: "Fallo al consultar la base de datos" });
    }
});

// 3. Ruta POST: Guardar un evento con su afiche físico
app.post('/api/eventos', upload.any(), async (req, res) => {
    try {
        const { nombre, fecha_inicio, fecha_fin, municipio, descripcion } = req.body;

        // Procesamos la foto si el usuario subió el afiche
        const archivo = req.files && req.files.length > 0 ? req.files[0] : null;
        const imagen_url = archivo ? `http://localhost:${PORT}/uploads/${archivo.filename}` : null;

        const [result] = await db.query(
            'INSERT INTO eventos (nombre, fecha_inicio, fecha_fin, municipio, descripcion, imagen_url) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, fecha_inicio || null, fecha_fin || null, municipio, descripcion, imagen_url]
        );

        res.status(201).json({ status: "success", insertId: result.insertId });
    } catch (error) {
        console.error("❌ Error guardando el evento en MySQL:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🎆 Servidor de Eventos corriendo en http://localhost:${PORT}`);
});