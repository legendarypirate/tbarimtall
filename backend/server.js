const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const sequelize = require('./config/database');
const passport = require('./config/passport');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS to allow both ports 3000 and 3002
const allowedOrigins = [];

// Add frontend URL from environment variable if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Always allow localhost:3000 and localhost:3002 in development
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
  allowedOrigins.push('http://localhost:3002');
}

// CORS middleware configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from uploads directory
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Handle CORS errors specifically
  if (err.message.includes('CORS')) {
    return res.status(403).json({ 
      error: 'CORS Error', 
      message: err.message,
      allowedOrigins: allowedOrigins
    });
  }
  
  res.status(err.status || 500).json({ 
    error: 'Internal Server Error', 
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message 
  });
});

// Database connection and server start
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync database - use appropriate option for your environment
    const syncOptions = { alter: true };
    if (process.env.NODE_ENV === 'development') {
      console.log('Development environment: Using alter option for database sync');
    } else {
      syncOptions.alter = false;
    }
    
    await sequelize.sync(syncOptions);
    console.log('Database synchronized.');

    // Log allowed origins on startup
    console.log('Allowed CORS origins:', allowedOrigins.length > 0 ? allowedOrigins : 'None configured');

    app.listen(PORT, () => {
      console.log(`=================================`);
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: ${sequelize.config.database}`);
      console.log(`CORS Allowed Origins: ${allowedOrigins.join(', ') || 'None'}`);
      console.log(`=================================`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;