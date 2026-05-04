require('dotenv').config()
const express = require('express')
const cors    = require('cors')

const app = express()

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Origen no permitido por CORS'))
  },
}))

app.use(express.json({ limit: '10kb' }))

// Rutas
app.use('/api/auth',        require('./routes/auth'))
app.use('/api/usuarios',    require('./routes/usuarios'))
app.use('/api/laboratorios',require('./routes/laboratorios'))
app.use('/api/equipos',     require('./routes/equipos'))
app.use('/api/tickets',     require('./routes/tickets'))
app.use('/api/categorias',  require('./routes/categorias'))
app.use('/api/dashboard',   require('./routes/dashboard'))
app.use('/api/log',         require('./routes/log'))

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', app: 'AguiLab API' }))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`🚀 AguiLab API corriendo en http://localhost:${PORT}`))
