import express from 'express';
import cors from 'cors'
import {errorMiddleware} from '../../../packages/error-handler/error-middleware'
import cookieParser from 'cookie-parser';

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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use(errorMiddleware)

const port = process.env.PORT || 6001;
const server = app.listen(port, () => {
    console.log(`Auth-service is running at http://localhost:${port}/api`);
})
server.on('error', (err) => {
    console.log('Server Error: ', err);
})