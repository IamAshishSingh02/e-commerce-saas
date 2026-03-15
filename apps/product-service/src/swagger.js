import swaggerAutogen from "swagger-autogen";

const outputFile = './swagger-output.json'
const endpointsFile = ['./routes/product.router.ts']

const doc = {
  info: {
    title: 'Product-service API',
    description: 'Auto generated Swagger docs',
    version: '1.0.0'
  },
  host: 'localhost:6002',
  schemes: ['http']
}

swaggerAutogen()(outputFile, endpointsFile, doc)