const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3006;

app.use(cors());
app.use(express.json());

let eventos = [
  { id: 1, nombre: "Festival del Corozo", municipio: "Sincé", fecha: "Octubre" },
  { id: 2, nombre: "Fiestas del Mar y del Volcán", municipio: "San Onofre", fecha: "Noviembre" }
];

app.get('/api/eventos', (req, res) => {
  res.json({ status: "success", data: eventos });
});

app.listen(PORT, () => {
  console.log(`Servidor de Eventos corriendo en http://localhost:${PORT}`);
});