export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}




require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Access variables
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB using env variable
mongoose.connect(MONGO_URI)
  .then(() => console.log('Database connected'))
  .catch(err => console.log(err));

app.get('/', (req, res) => {
  res.send('Environment variables working!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});