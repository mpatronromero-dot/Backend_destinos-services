const express = require('express');
const cors = require('cors');

// Configuración de la base de datos
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
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Ruta GET: Obtener datos desde Railway
app.get('/api/alojamientos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM alojamientos');
        res.json({ status: "success", data: rows });
    } catch (error) {
        console.error("Error obteniendo alojamientos:", error);
        res.status(500).json({ status: "error", message: "Fallo al consultar la base de datos" });
    }
});

// Ruta POST: Guardar nuevos datos en Railway
app.post('/api/alojamientos', async (req, res) => {
    try {
        // Asegúrate de que estos nombres coincidan con los que envías desde el Front-End
        const { nombre, municipio, tipo, descripcion } = req.body;

        const [result] = await db.query(
            'INSERT INTO alojamientos (nombre, municipio, tipo, descripcion) VALUES (?, ?, ?, ?)',
            [nombre, municipio, tipo, descripcion]
        );

        res.status(201).json({ 
            status: "success", 
            message: "Alojamiento guardado correctamente", 
            insertId: result.insertId 
        });
    } catch (error) {
        console.error("Error guardando el alojamiento:", error);
        res.status(500).json({ status: "error", message: "Fallo al guardar en la base de datos" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de Alojamientos corriendo en http://localhost:${PORT}`);
});