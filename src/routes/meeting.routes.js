const express = require('express');
const meetingController = require('../controllers/meetingController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleCheck');
const { createMeetingValidators } = require('../validations/validation');

const router = express.Router();

router.use(authenticate);

router.get('/', meetingController.list);
router.get('/:id/analytics', meetingController.analytics);
router.get('/:id', meetingController.getOne);
router.post('/', requireRole('admin'), createMeetingValidators, meetingController.create);
router.put('/:id', requireRole('admin'), createMeetingValidators, meetingController.update);
router.delete('/:id', requireRole('admin'), meetingController.remove);

module.exports = router;
