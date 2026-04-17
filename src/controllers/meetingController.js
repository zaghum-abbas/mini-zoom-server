const { validationResult } = require('express-validator');
const meetingService = require('../services/meetingService');
const analyticsService = require('../services/analyticsService');
const { HTTP_STATUS } = require('../constants/http');
const { error, success } = require('../utils/response');
const { MESSAGES } = require('../constants/messages');

const create = async (req, res, next) => {
  try {
    console.log("req.body",req.body);
    const errors = validationResult(req);
    console.log("errors",errors);
    if (!errors.isEmpty()) {
      return error(res, MESSAGES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, errors.array());
    }
    const meeting = await meetingService.createMeetingForUser(req.authUser, req.body);
    return success(res, { meeting }, MESSAGES.MEETING_CREATED, HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const meetings = await meetingService.listMeetingsForUser(req.authUser);
    return success(res, { meetings }, MESSAGES.MEETING_FETCHED, HTTP_STATUS.OK);
  } catch (err) {
    return next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const meeting = await meetingService.getMeetingById(req.params.id, req.authUser);
    return success(res, { meeting }, MESSAGES.MEETING_FETCHED, HTTP_STATUS.OK);
  } catch (err) {
    return next(err);
  }
};

const analytics = async (req, res, next) => {
  try {
    await meetingService.getMeetingById(req.params.id, req.authUser);
    const analytics = await analyticsService.getAnalyticsForMeeting(req.params.id);
    return success(res, { analytics }, MESSAGES.MEETING_ANALYTICS_FETCHED, HTTP_STATUS.OK);
  } catch (err) {
    return next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const meeting = await meetingService.deleteMeetingById(req.params.id, req.authUser);
    return success(res, { meeting }, MESSAGES.MEETING_DELETED, HTTP_STATUS.OK);
  } catch (err) {
    return next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, MESSAGES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, errors.array());
    }
    const meeting = await meetingService.updateMeetingById(req.params.id, req.authUser, req.body);
    return success(res, { meeting }, MESSAGES.MEETING_UPDATED, HTTP_STATUS.OK);
  } catch (err) {
    return next(err);
  }
};

module.exports = { create, list, getOne, analytics, remove, update };
