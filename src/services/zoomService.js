const axios = require('axios');
const https = require('https');
const env = require('../config/env');
const { HTTP_MESSAGES, HTTP_STATUS } = require('../constants/http');

let cachedToken = null;
let cachedExpiry = 0;

const formatNetworkError = (err) => {
  if (!err) return 'Unknown error';
  if (err.name === 'AggregateError' && Array.isArray(err.errors) && err.errors.length) {
    return err.errors.map((e) => e?.code || e?.message || String(e)).join('; ');
  }
  if (err.code) return `${err.code}: ${err.message || 'request failed'}`;
  return err.message || String(err);
};

const getAccessToken = async () => {
  const { accountId, clientId, clientSecret } = env.zoom;
  if (!accountId || !clientId || !clientSecret) {
    const err = new Error(HTTP_MESSAGES.ZOOM_OAUTH_NOT_CONFIGURED);
    err.status = HTTP_STATUS.SERVICE_UNAVAILABLE;
    throw err;
  }

  const now = Date.now();
  if (cachedToken && cachedExpiry - 60_000 > now) {
    return cachedToken;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`;

  const axiosOpts = {
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 15000,
  };
  if (process.env.ZOOM_OAUTH_FORCE_IPV4 === '1') {
    axiosOpts.httpsAgent = new https.Agent({ family: 4 });
  }

  let data;
  try {
    ({ data } = await axios.post(url, null, axiosOpts));
  } catch (err) {
    if (err?.response) {
      const msg =
        err.response.data?.reason ||
        err.response.data?.message ||
        err.response.data?.error ||
        `Zoom OAuth HTTP ${err.response.status}`;
      const e = new Error(`Zoom OAuth failed: ${msg}`);
      e.status = err.response.status;
      e.errors = err.response.data;
      throw e;
    }
    const detail = formatNetworkError(err);
    const e = new Error(
      `Cannot reach Zoom OAuth (${detail}). Check internet, VPN/firewall, DNS, and system clock. If you suspect a broken IPv6 route, set ZOOM_OAUTH_FORCE_IPV4=1 in .env or run Node with NODE_OPTIONS=--dns-result-order=ipv4first.`
    );
    e.status = HTTP_STATUS.SERVICE_UNAVAILABLE;
    e.cause = err;
    throw e;
  }

  if (!data?.access_token) {
    const e = new Error('Zoom OAuth returned no access_token');
    e.status = HTTP_STATUS.SERVICE_UNAVAILABLE;
    throw e;
  }

  cachedToken = data.access_token;
  cachedExpiry = now + (data.expires_in || 3600) * 1000;
  return cachedToken;
};

const createMeeting = async (payload) => {
  const token = await getAccessToken();
  const baseUrl = env.zoom.apiBaseUrl;
  const isScheduled = Boolean(payload.startTime);
  const body = {
    topic: payload.topic,
    type: isScheduled ? 2 : 1,
    duration: payload.durationMinutes,
    timezone: payload.timezone || 'UTC',
    agenda: payload.agenda,
    settings: {
      waiting_room: true,
      join_before_host: false,
      ...payload.settings,
    },
  };
  if (isScheduled) {
    const st = payload.startTime instanceof Date ? payload.startTime.toISOString() : payload.startTime;
    body.start_time = st;
  }

  try {
    const { data } = await axios.post(`${baseUrl}/users/me/meetings`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });
    return data;
  } catch (err) {
    if (err?.response) {
      const zoomMsg =
        err.response.data?.message ||
        err.response.data?.reason ||
        err.response.data?.error ||
        `Zoom API error (${err.response.status})`;
      const e = new Error(zoomMsg);
      e.status = err.response.status;
      e.errors = err.response.data;
      throw e;
    }
    throw err;
  }
};

const updateMeeting = async (zoomMeetingId, payload) => {
  const token = await getAccessToken();
  const baseUrl = env.zoom.apiBaseUrl;

  const body = {};
  if (payload.topic != null) body.topic = payload.topic;
  if (payload.agenda != null) body.agenda = payload.agenda;
  if (payload.durationMinutes != null) body.duration = payload.durationMinutes;
  if (payload.timezone != null) body.timezone = payload.timezone;
  if (payload.startTime != null) {
    const st = payload.startTime instanceof Date ? payload.startTime.toISOString() : payload.startTime;
    body.start_time = st;
    body.type = 2;
  }

  try {
    await axios.patch(`${baseUrl}/meetings/${encodeURIComponent(String(zoomMeetingId))}`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });
  } catch (err) {
    if (err?.response) {
      const zoomMsg =
        err.response.data?.message ||
        err.response.data?.reason ||
        err.response.data?.error ||
        `Zoom API error (${err.response.status})`;
      const e = new Error(zoomMsg);
      e.status = err.response.status;
      e.errors = err.response.data;
      throw e;
    }
    throw err;
  }
};

module.exports = { getAccessToken, createMeeting, updateMeeting };
