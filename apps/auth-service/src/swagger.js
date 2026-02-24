import swaggerAutogen from "swagger-autogen";

const outputFile = './swagger-output.json'
const endpointsFile = ['./routes/auth.router.ts']

const doc = {
  info: {
    title: 'Auth-service API',
    description: 'Auto generated Swagger docs',
    version: '1.0.0'
  },
  host: 'localhost:6001',
  schemes: ['http']
}

swaggerAutogen()(outputFile, endpointsFile, doc)