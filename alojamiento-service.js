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
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Ruta GET: Obtener TODOS los alojamientos
app.get('/api/alojamientos', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM alojamientos');
        res.json({ status: "success", data: rows });
    } catch (error) {
        console.error("Error obteniendo alojamientos:", error);
        res.status(500).json({ status: "error", message: "Fallo al consultar la base de datos" });
    }
});

// Ruta GET: Obtener UN solo alojamiento con sus habitaciones y galería
app.get('/api/alojamientos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [alojamientos] = await db.query('SELECT * FROM alojamientos WHERE id = ?', [id]);
        
        if (alojamientos.length === 0) {
            return res.status(404).json({ status: "error", message: "Alojamiento no encontrado" });
        }
        
        const alojamiento = alojamientos[0];
        const [habitaciones] = await db.query('SELECT * FROM habitaciones WHERE alojamiento_id = ?', [id]);
        const [galeria] = await db.query('SELECT url_foto FROM galeria_alojamientos WHERE alojamiento_id = ?', [id]);
        
        alojamiento.habitaciones = habitaciones;
        alojamiento.galeria = galeria;
        
        res.json({ status: "success", data: alojamiento });
    } catch (error) {
        console.error("Error obteniendo detalles del alojamiento:", error);
        res.status(500).json({ status: "error", message: "Fallo al consultar la base de datos" });
    }
});

// Ruta POST: Guardar hotel, habitaciones y galería
app.post('/api/alojamientos', async (req, res) => {
  try {
    const { nombre, municipio, tipo, descripcion, imagen_url, habitaciones, galeria } = req.body;

    const [result] = await db.query(
      'INSERT INTO alojamientos (nombre, municipio, tipo, descripcion, imagen_url) VALUES (?, ?, ?, ?, ?)',
      [nombre, municipio, tipo, descripcion, imagen_url || 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80']
    );

    const alojamientoId = result.insertId;

    if (habitaciones && habitaciones.length > 0) {
      for (let hab of habitaciones) {
        await db.query(
          'INSERT INTO habitaciones (alojamiento_id, tipo_habitacion, descripcion_camas, capacidad_personas, precio_noche) VALUES (?, ?, ?, ?, ?)',
          [alojamientoId, hab.tipo_habitacion, hab.descripcion_camas, hab.capacidad_personas, hab.precio_noche]
        );
      }
    }

    if (galeria && galeria.length > 0) {
      for (let url of galeria) {
        if(url.trim() !== '') {
            await db.query('INSERT INTO galeria_alojamientos (alojamiento_id, url_foto) VALUES (?, ?)', [alojamientoId, url]);
        }
      }
    }

    res.status(201).json({ status: "success", message: "Guardado exitoso", insertId: alojamientoId });
  } catch (error) {
    console.error("Error guardando el alojamiento:", error);
    res.status(500).json({ status: "error", message: "Fallo al guardar en la base de datos" });
  }
});

app.listen(PORT, () => {
    console.log(`Servidor de Alojamientos corriendo en http://localhost:${PORT}`);
});