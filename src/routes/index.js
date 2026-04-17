const express = require('express');
const authRoutes = require('./auth.routes');
const meetingRoutes = require('./meeting.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/meetings', meetingRoutes);

module.exports = router;
