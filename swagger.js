const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'EcuaBus API',
            version: '1.0.0',
            description: 'API para la gestión de usuarios en EcuaBus',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor local',
            },
        ],
    },
    apis: ['./index.js'], // Cambia este archivo al que contiene tus endpoints
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;
