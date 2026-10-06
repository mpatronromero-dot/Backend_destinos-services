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
const PORT = 3006;

app.use(cors());
app.use(express.json());

// Ruta GET: Obtener todos los eventos
app.get('/api/eventos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM eventos');
        res.json({ status: "success", data: rows });
    } catch (error) {
        console.error("Error obteniendo eventos:", error);
        res.status(500).json({ status: "error", message: "Fallo al consultar la base de datos" });
    }
});

// Ruta POST: Guardar un nuevo evento
app.post('/api/eventos', async (req, res) => {
    try {
        const { nombre, fecha, municipio, descripcion } = req.body;

        const [result] = await db.query(
            'INSERT INTO eventos (nombre, fecha, municipio, descripcion) VALUES (?, ?, ?, ?)',
            [nombre, fecha, municipio, descripcion]
        );

        res.status(201).json({ 
            status: "success", 
            message: "Evento guardado correctamente", 
            insertId: result.insertId 
        });
    } catch (error) {
        console.error("Error guardando el evento:", error);
        res.status(500).json({ status: "error", message: "Fallo al guardar en la base de datos" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de Eventos corriendo en http://localhost:${PORT}`);
});