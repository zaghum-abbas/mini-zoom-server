const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const env = require('../config/env');
const { HTTP_STATUS } = require('../constants/http');

const signToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

const registerUser = async ({ email, password, name, role = 'user' }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.status = HTTP_STATUS.CONFLICT;
    throw err;
  }
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ email, passwordHash, name, role });
  const token = signToken(user);
  return { user: sanitizeUser(user), token };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = HTTP_STATUS.UNAUTHORIZED;
    throw err;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error('Invalid credentials');
    err.status = HTTP_STATUS.UNAUTHORIZED;
    throw err;
  }
  const token = signToken(user);
  return { user: sanitizeUser(user), token };
};

const sanitizeUser = (userDoc) => ({
  id: userDoc._id.toString(),
  email: userDoc.email,
  name: userDoc.name,
  role: userDoc.role,
  createdAt: userDoc.createdAt,
});

module.exports = { registerUser, loginUser, signToken, sanitizeUser };
