const express = require('express');
const cors = require('cors');
const { Client } = require('@elastic/elasticsearch');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Conexión al motor Elasticsearch local
const elasticClient = new Client({ node: 'http://localhost:9200' });

// 2. Ruta de búsqueda Search-as-you-type y Facets
app.get(['/', '/buscador', '/api/buscador'], async (req, res) => {
    const { q, tipo, municipio } = req.query;
    
        console.log(`🔍 Buscando en Elastic: "${q}" | Tipo: ${tipo} | Municipio: ${municipio}`);

    try {
        if (!q && !tipo && !municipio) {
            return res.json([]);
        }

        // Construcción de la consulta (Query DSL de Elasticsearch)
        const mustClauses = [];

        // Búsqueda Full-Text (Search-as-you-type parcial)
        if (q) {
            mustClauses.push({
                multi_match: {
                    query: q,
                    fields: ['nombre^3', 'descripcion'], // Da más peso al nombre
                    fuzziness: 'AUTO' // Permite pequeños errores ortográficos
                }
            });
        }

        // Filtro Facet por Tipo (Ej: Solo mostrar Hoteles)
        if (tipo) {
            mustClauses.push({
                term: { tipo: tipo }
            });
        }

        // Filtro Facet por Municipio (Ej: Solo mostrar Tolú)
        if (municipio) {
            mustClauses.push({
                term: { municipio: municipio }
            });
        }

        // Ejecutar la búsqueda en Elasticsearch
        const response = await elasticClient.search({
            index: 'destinos_sucre',
            body: {
                query: {
                    bool: {
                        must: mustClauses
                    }
                }
            }
        });

        // Extraer los resultados limpios del formato de Elastic
        const resultados = response.hits.hits.map(hit => hit._source);
        
        res.json(resultados);

    } catch (error) {
        console.error('❌ Error en búsqueda Elastic:', error);
        res.status(500).json({ status: 'error', message: 'Fallo al buscar en Elasticsearch' });
    }
});

// Ruta de chequeo de salud (la que ya probamos)
app.get('/api/check-elastic', async (req, res) => {
    try {
        const health = await elasticClient.cluster.health({});
        res.json({ status: 'Conectado a Elasticsearch 🚀', info: health });
    } catch (error) {
        res.status(500).json({ status: 'Error de conexión' });
    }
});

const PORT = process.env.PORT_BUSCADOR || 3007;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Buscador (Elastic) corriendo en http://localhost:${PORT}`);
});