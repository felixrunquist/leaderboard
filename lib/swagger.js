import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Leaderboard API',
      version: '1.0.0',
      description: 'API documentation for the leaderboard backend',
    },
  },
  apis: ['./pages/api/leaderboard/**/*.js'], // Points to API routes
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;