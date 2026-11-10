require('dotenv').config();
const mysql = require('mysql2/promise');
const { Client } = require('@elastic/elasticsearch');

const elasticClient = new Client({ node: 'http://localhost:9200' });

async function sincronizarTodosLosDatos() {
    try {
        console.log('⏳ Conectando a MySQL...');
        const db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sucre_turistico_db',
            port: process.env.DB_PORT || 3306
        });

        const indice = 'destinos_sucre';
        
        // 1. llamamos el index
        const exists = await elasticClient.indices.exists({ index: indice });
        if (exists) {
            await elasticClient.indices.delete({ index: indice });
            console.log(`🧹 Índice '${indice}' formateado.`);
        }

        // 2. Creamos la estructura centralizada
        await elasticClient.indices.create({
            index: indice,
            body: {
                mappings: {
                    properties: {
                        id: { type: 'integer' },
                        nombre: { type: 'text' },
                        descripcion: { type: 'text' },
                        municipio: { type: 'keyword' }, 
                        tipo: { type: 'keyword' } // Clasificará si es Hotel, Restaurante, etc.
                    }
                }
            }
        });
        console.log(`✅ Índice '${indice}' creado para todas las categorías.`);

        // 3. Función dinámica para migrar cualquier tabla a Elasticsearch
        async function indexarTabla(nombreTabla, etiquetaTipo) {
            try {
                // Asumimos que todas tus tablas tienen al menos id, nombre, municipio y descripcion
                const [filas] = await db.execute(`SELECT id, nombre, municipio, descripcion FROM ${nombreTabla}`);
                
                if (filas.length > 0) {
                    for (const item of filas) {
                        await elasticClient.index({
                            index: indice,
                            id: `${nombreTabla}_${item.id}`, // ID único combinando tabla y su id real
                            body: {
                                id: item.id,
                                nombre: item.nombre,
                                descripcion: item.descripcion || '',
                                municipio: item.municipio || 'No especificado',
                                tipo: etiquetaTipo
                            }
                        });
                    }
                    console.log(`🚀 ${filas.length} registros de ${etiquetaTipo} indexados.`);
                } else {
                    console.log(`⚠️ La tabla '${nombreTabla}' está vacía. No se indexó nada de esta categoría.`);
                }
            } catch (error) {
                console.log(`⚠️ Tabla '${nombreTabla}' omitida (Posiblemente no existe aún o faltan columnas).`);
            }
        }

        // 4. Ejecutamos la migración masiva para todas tus categorías
        await indexarTabla('alojamientos', 'Alojamiento');
        await indexarTabla('gastronomia', 'Gastronomía');
        await indexarTabla('experiencias', 'Experiencia');
        await indexarTabla('eventos', 'Evento');

        await db.end();
        console.log('🎉 Sincronización TOTAL completada.');

    } catch (error) {
        console.error('❌ Error general durante la sincronización:', error);
    }
}

sincronizarTodosLosDatos();