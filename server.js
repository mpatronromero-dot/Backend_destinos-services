const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Datos de prueba para Sucre Turístico
let destinos = [
  { id: 1, nombre: "Coveñas", municipio: "Coveñas", tipo: "Playa", descripcion: "Playas de agua tibia y tranquilas." },
  { id: 2, nombre: "Tolú", municipio: "Santiago de Tolú", tipo: "Playa / Ecoturismo", descripcion: "Gran oferta turística y gastronómica." },
  { id: 3, nombre: "San Onofre", municipio: "San Onofre", tipo: "Playa / Ecoturismo", descripcion: "Hogar de Rincón del Mar, playas vírgenes de arena blanca y gran biodiversidad." }
];

// Ruta principal para obtener los destinos
app.get('/api/destinos', (req, res) => {
  res.json({ status: "success", data: destinos });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});