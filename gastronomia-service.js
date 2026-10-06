const express = require('express');
const cors = require('cors');
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

// Ruta GET: Obtener todos los platos gastronómicos
app.get('/api/gastronomia', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM gastronomia');
        res.json({ status: "success", data: rows });
    } catch (error) {
        console.error("Error obteniendo gastronomía:", error);
        res.status(500).json({ status: "error", message: "Fallo al consultar la base de datos" });
    }
});

// Ruta POST: Guardar un nuevo plato gastronómico
app.post('/api/gastronomia', async (req, res) => {
    try {
        const { nombre_plato, descripcion, lugar_tipico } = req.body;

        const [result] = await db.query(
            'INSERT INTO gastronomia (nombre_plato, descripcion, lugar_tipico) VALUES (?, ?, ?)',
            [nombre_plato, descripcion, lugar_tipico]
        );

        res.status(201).json({ 
            status: "success", 
            message: "Plato guardado correctamente", 
            insertId: result.insertId 
        });
    } catch (error) {
        console.error("Error guardando gastronomía:", error);
        res.status(500).json({ status: "error", message: "Fallo al guardar en la base de datos" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de Gastronomía corriendo en http://localhost:${PORT}`);
});