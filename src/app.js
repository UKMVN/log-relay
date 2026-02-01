const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const logRoutes = require('./routes/logRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/logs', logRoutes);
app.use('/api/users', userRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('Log Server API Running');
});

module.exports = app;
