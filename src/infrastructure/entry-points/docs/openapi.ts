export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: '',
    version: '0.0.0',
    description: '',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development',
    },
  ],
} as const;
