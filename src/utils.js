export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}




// Install: npm install express mongoose bcrypt jsonwebtoken

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const SECRET = "secretkey";

// Connect DB
mongoose.connect('mongodb://127.0.0.1:27017/miniProjectDB')
  .then(() => console.log('DB Connected'));

// Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model('User', userSchema);

// Register
app.post('/register', async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);
  const user = new User({ email: req.body.email, password: hashed });
  await user.save();
  res.json({ message: 'User registered' });
});

// Login
app.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const match = await bcrypt.compare(req.body.password, user.password);

  if (!match) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id }, SECRET);
  res.json({ token });
});

// Middleware
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const verified = jwt.verify(token, SECRET);
    req.user = verified;
    next();
  } catch {
    res.status(400).json({ message: 'Invalid token' });
  }
}

// Protected route
app.get('/dashboard', auth, (req, res) => {
  res.json({ message: 'Welcome User', user: req.user });
});

app.listen(3000, () => console.log('Server running'));