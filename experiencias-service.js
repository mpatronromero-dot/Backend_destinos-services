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
const PORT = 3004;

app.use(cors());
app.use(express.json());

// 1. Crear carpeta 'uploads' si no existe y hacerla pública
const dir = './uploads';
if (!fs.existsSync(dir)){ fs.mkdirSync(dir); }
app.use('/uploads', express.static('uploads'));

// 2. Configurar Multer (Dónde y cómo guardar las fotos)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});
// Usamos upload.any() para aceptar el archivo sin importar si viene como 'imagen' o 'imagen_url'
const upload = multer({ storage: storage });

// Ruta GET
app.get('/api/experiencias', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM experiencias');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Fallo al consultar la base de datos" });
    }
});

// Usamos upload.any() para asegurarnos de que reciba la imagen sin importar el nombre del campo del formulario
app.post('/api/experiencias', upload.any(), async (req, res) => {
    try {
        const { nombre, municipio, tipo, descripcion, costo_estimado, tipo_tarifa } = req.body;
        
        // Capturamos el archivo enviado desde React
        const archivo = req.files && req.files.length > 0 ? req.files[0] : null;
        const imagen_url = archivo ? `http://localhost:3004/uploads/${archivo.filename}` : null;

        const [result] = await db.query(
            'INSERT INTO experiencias (nombre, municipio, tipo, descripcion, costo_estimado, tipo_tarifa, imagen_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre, municipio, tipo, descripcion, costo_estimado, tipo_tarifa, imagen_url]
        );

        res.status(201).json({ status: "success", insertId: result.insertId });
    } catch (error) {
        console.error("❌ Error guardando la experiencia:", error);
        res.status(500).json({ status: "error", message: "Fallo al guardar en la base de datos" });
    }
});

app.listen(PORT, () => {
    console.log(`🏖️ Servidor de Experiencias corriendo en http://localhost:${PORT}`);
});