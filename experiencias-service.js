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
const PORT = 3004;

app.use(cors());
app.use(express.json());

// Ruta GET: Obtener todas las experiencias
app.get('/api/experiencias', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM experiencias');
        res.json({ status: "success", data: rows });
    } catch (error) {
        console.error("Error obteniendo experiencias:", error);
        res.status(500).json({ status: "error", message: "Fallo al consultar la base de datos" });
    }
});

// Ruta POST: Guardar una nueva experiencia
app.post('/api/experiencias', async (req, res) => {
    try {
        const { nombre, descripcion, costo_estimado } = req.body;

        const [result] = await db.query(
            'INSERT INTO experiencias (nombre, descripcion, costo_estimado) VALUES (?, ?, ?)',
            [nombre, descripcion, costo_estimado]
        );

        res.status(201).json({ 
            status: "success", 
            message: "Experiencia guardada correctamente", 
            insertId: result.insertId 
        });
    } catch (error) {
        console.error("Error guardando la experiencia:", error);
        res.status(500).json({ status: "error", message: "Fallo al guardar en la base de datos" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de Experiencias corriendo en http://localhost:${PORT}`);
});