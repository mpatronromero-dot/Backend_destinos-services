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
        cb(null, 'uploads/') // Se guardan en la carpeta uploads
    },
    filename: function (req, file, cb) {
        // Se renombra el archivo con la fecha actual para que no se sobreescriban
        cb(null, Date.now() + path.extname(file.originalname))
    }
});
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
//RUTA de POST para guardar experiencias con foto
app.post('/api/experiencias', upload.single('imagen'), async (req, res) => {
    try {
       
        const { nombre, municipio, tipo, descripcion, costo_estimado, tipo_tarifa } = req.body;
        
        // 2. Procesamos la foto
        const imagen_url = req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : null;

        const [result] = await db.query(
            'INSERT INTO experiencias (nombre, municipio, tipo, descripcion, costo_estimado, tipo_tarifa, imagen_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre, municipio, tipo, descripcion, costo_estimado, tipo_tarifa, imagen_url]
        );

        res.status(201).json({ status: "success", insertId: result.insertId });
    } catch (error) {
        console.error("Error guardando la experiencia:", error);
        res.status(500).json({ status: "error", message: "Fallo al guardar en la base de datos" });
    }
});
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});