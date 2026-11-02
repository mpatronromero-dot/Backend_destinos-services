const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que la carpeta uploads exista
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de Multer para guardar archivos locales
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

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
// Servir la carpeta uploads de manera pública
app.use('/uploads', express.static(uploadDir));

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

// Ruta POST: Guardar hotel (con imagen local por Multer)
app.post('/api/alojamientos', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, municipio, tipo, descripcion } = req.body;
    const imagen_url = req.file ? `http://localhost:3002/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      'INSERT INTO alojamientos (nombre, municipio, tipo, descripcion, imagen_url) VALUES (?, ?, ?, ?, ?)',
      [nombre, municipio, tipo, descripcion, imagen_url]
    );

    res.status(201).json({ status: "success", message: "Guardado exitoso", insertId: result.insertId });
  } catch (error) {
    console.error("Error guardando el alojamiento:", error);
    res.status(500).json({ status: "error", message: "Fallo al guardar en la base de datos" });
  }
});

// ==========================================
// CRUD DE HABITACIONES (Con soporte de fotos locales)
// ==========================================

// Obtener habitaciones de un alojamiento
app.get('/api/alojamientos/:id/habitaciones', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT id, alojamiento_id, 
                   tipo_habitacion AS nombre, 
                   precio_noche AS precio, 
                   descripcion_camas AS descripcion, 
                   imagen_url 
            FROM habitaciones WHERE alojamiento_id = ?
        `, [req.params.id]);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener habitaciones:", error);
        res.status(500).json({ error: "Error al obtener habitaciones" });
    }
});

// Crear nueva habitación con foto
app.post('/api/habitaciones', upload.single('imagen'), async (req, res) => {
    try {
        const { alojamiento_id, nombre, precio, descripcion } = req.body;
        const imagen_url = req.file ? `http://localhost:3002/uploads/${req.file.filename}` : null;

        await db.query(
            'INSERT INTO habitaciones (alojamiento_id, tipo_habitacion, precio_noche, descripcion_camas, imagen_url) VALUES (?, ?, ?, ?, ?)',
            [alojamiento_id, nombre, precio, descripcion, imagen_url]
        );
        res.json({ success: true, message: "Habitación agregada" });
    } catch (error) {
        console.error("Error al guardar habitación:", error);
        res.status(500).json({ error: "Error al guardar habitación" });
    }
});

// Editar habitación
app.put('/api/habitaciones/:id', upload.single('imagen'), async (req, res) => {
    try {
        const { nombre, precio, descripcion } = req.body;
        const idHabitacion = req.params.id;
        
        if (req.file) {
            const imagen_url = `http://localhost:3002/uploads/${req.file.filename}`;
            await db.query(
                'UPDATE habitaciones SET tipo_habitacion=?, precio_noche=?, descripcion_camas=?, imagen_url=? WHERE id=?',
                [nombre, precio, descripcion, imagen_url, idHabitacion]
            );
        } else {
            await db.query(
                'UPDATE habitaciones SET tipo_habitacion=?, precio_noche=?, descripcion_camas=? WHERE id=?',
                [nombre, precio, descripcion, idHabitacion]
            );
        }
        res.json({ success: true, message: "Habitación actualizada" });
    } catch (error) {
        console.error("Error al actualizar habitación:", error);
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// Eliminar habitación
app.delete('/api/habitaciones/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM habitaciones WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: "Habitación eliminada" });
    } catch (error) {
        console.error("Error al eliminar habitación:", error);
        res.status(500).json({ error: "Error al eliminar" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de Alojamientos corriendo en http://localhost:${PORT}`);
});