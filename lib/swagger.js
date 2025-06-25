import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Leaderboard API',
      version: '1.0.0',
      description: 'API documentation for the leaderboard backend. You can try the routes out by logging in as a user using the `/api/auth` route. ',
    },
  },
  apis: ['./pages/api/**/*.js'], // Points to API routes
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;