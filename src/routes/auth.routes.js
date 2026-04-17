const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

const registerValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').optional().isString().trim(),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString(),
];

router.post('/register', registerValidators, authController.register);
router.post('/login', loginValidators, authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
