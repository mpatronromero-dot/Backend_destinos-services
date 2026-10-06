const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

// Datos de prueba para Gastronomía en Sucre
let restaurantes = [
  { id: 1, nombre: "Donde Maruja", municipio: "Coveñas", especialidad: "Pescado frito y patacón" },
  { id: 2, nombre: "El Sabor Costeño", municipio: "Santiago de Tolú", especialidad: "Ceviche de camarón" }
];

app.get('/api/gastronomia', (req, res) => {
  res.json({ status: "success", data: restaurantes });
});

app.listen(PORT, () => {
  console.log(`Servidor de Gastronomía corriendo en http://localhost:${PORT}`);
});