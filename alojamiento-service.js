const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Datos de prueba para Alojamientos en Sucre
let alojamientos = [
  { id: 1, nombre: "Hotel Palma Linda", municipio: "Coveñas", tipo: "Hotel frente al mar", precioNoche: 180000 },
  { id: 2, nombre: "Hostal El Viajero", municipio: "Santiago de Tolú", tipo: "Hostal", precioNoche: 70000 }
];

app.get('/api/alojamientos', (req, res) => {
  res.json({ status: "success", data: alojamientos });
});

app.listen(PORT, () => {
  console.log(`Servidor de Alojamientos corriendo en http://localhost:${PORT}`);
});