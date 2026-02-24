import express from 'express';
import cors from 'cors'
import {errorMiddleware} from '@packages/error-handler/error-middleware'
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.router'
import swaggerUi from 'swagger-ui-express'
import { readFileSync } from 'fs';
import { join } from 'path';

// Swagger file is in the same directory as main.js after build
const swaggerDocument = JSON.parse(
  readFileSync(join(__dirname, 'swagger-output.json'), 'utf-8')
);

const app = express();

app.use(cors({
  origin: ['http://localhost:3000'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())

// Health Route
app.get('/auth-health', (req, res) => {
  res.json({ message: 'Auth-service is running' })
})

// Documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.get('/docs-json', (req, res) => {
  res.json(swaggerDocument)
})

// All other routes
app.use('/api', authRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Custom made error middleware
app.use(errorMiddleware)

const port = process.env.PORT || 6001;
const server = app.listen(port, () => {
    console.log(`Auth-service is running at http://localhost:${port}/api`);
    console.log(`Swagger Docs available at http://localhost:${port}/docs`);
})
server.on('error', (err) => {
    console.log('Server Error: ', err);
})