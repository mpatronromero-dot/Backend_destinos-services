const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3007;

app.use(cors());
app.use(express.json());

app.get('/api/buscador', (req, res) => {
  const query = req.query.q || '';
  res.json({
    status: "success",
    query: query,
    resultados: [
      { tipo: "destino", nombre: "Coveñas", municipio: "Coveñas" },
      { tipo: "alojamiento", nombre: "Hotel Palma Linda", municipio: "Coveñas" }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Servidor Buscador corriendo en http://localhost:${PORT}`);
});