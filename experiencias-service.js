const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json());

// Datos de prueba para Experiencias y Tours
let experiencias = [
  { id: 1, titulo: "Paseo en lancha por la ciénaga de la Caimanera", municipio: "Coveñas", duracion: "2 horas" },
  { id: 2, titulo: "Tour en bici-taxi histórico", municipio: "Santiago de Tolú", duracion: "1 hora" }
];

app.get('/api/experiencias', (req, res) => {
  res.json({ status: "success", data: experiencias });
});

app.listen(PORT, () => {
  console.log(`Servidor de Experiencias corriendo en http://localhost:${PORT}`);
});