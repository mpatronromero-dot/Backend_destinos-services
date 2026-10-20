const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
const PORT = 3008; // El puerto exclusivo para seguridad

app.use(cors());
app.use(express.json());

// Esta es nuestra "Llave Maestra" para crear los carnets. (En producción va en el .env)
const JWT_SECRET = process.env.JWT_SECRET || 'sucre_turistico_secreto_123'; 

// ==========================================
// RUTA 1: REGISTRO DE NUEVO DUEÑO DE HOTEL
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nombre_encargado, email, password } = req.body;

        // 1. Verificar que el correo no esté registrado ya
        const [existe] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (existe.length > 0) {
            return res.status(400).json({ status: 'error', message: 'El correo ya está registrado' });
        }

        // 2. Encriptar la contraseña (hashing)
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Guardar al nuevo usuario en Railway
        await db.query(
            'INSERT INTO usuarios (nombre_encargado, email, password_hash) VALUES (?, ?, ?)',
            [nombre_encargado, email, password_hash]
        );

        res.status(201).json({ status: 'success', message: 'Cuenta creada exitosamente. Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor al registrar' });
    }
});

// ==========================================
// RUTA 2: LOGIN (INICIAR SESIÓN)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar si el usuario existe por su email
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (usuarios.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Correo o contraseña incorrectos' });
        }

        const usuario = usuarios[0];

        // 2. Comparar la contraseña escrita con la encriptada en la base de datos
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ status: 'error', message: 'Correo o contraseña incorrectos' });
        }

        // 3. Crear el Token de Sesión (Carnet digital válido por 8 horas)
        const token = jwt.sign(
        { id: usuario.id, nombre: usuario.nombre_encargado, email: usuario.email },
        process.env.JWT_SECRET || 'secreto_super_seguro', // <-- Aquí está la magia
        { expiresIn: '8h' }
        );

        res.json({ 
            status: 'success', 
            message: `¡Bienvenido de vuelta, ${usuario.nombre_encargado}!`, 
            token: token, 
            usuario: { id: usuario.id, nombre: usuario.nombre_encargado, email: usuario.email }
        });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor al iniciar sesión' });
    }
});

app.listen(PORT, () => {
    console.log(`🛡️  Servidor de Autenticación corriendo en http://localhost:${PORT}`);
});