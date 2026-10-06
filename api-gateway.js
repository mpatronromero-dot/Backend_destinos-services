const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3005;

app.use(cors());

// Redirección de rutas a microservicios
app.use('/api/destinos', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
app.use('/api/alojamientos', createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }));
app.use('/api/gastronomia', createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true }));
app.use('/api/experiencias', createProxyMiddleware({ target: 'http://localhost:3004', changeOrigin: true }));
app.use('/api/eventos', createProxyMiddleware({ target: 'http://localhost:3006', changeOrigin: true }));
app.use('/api/buscador', createProxyMiddleware({ target: 'http://localhost:3007', changeOrigin: true }));

app.get('/', (req, res) => {
  res.send('API Gateway de Sucre Turístico funcionando correctamente.');
});

app.listen(PORT, () => {
  console.log(`API Gateway corriendo en http://localhost:${PORT}`);
});