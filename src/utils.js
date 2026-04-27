export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}




const express = require('express');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

// Validation rules
app.post('/register',
  [
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required')
  ],
  (req, res) => {
    const errors = validationResult(req);

    // Check for validation errors
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If valid
    res.json({ message: 'User data is valid' });
  }
);

app.listen(3000, () => console.log('Server running'));