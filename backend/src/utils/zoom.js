// Zoom integration using Server-to-Server OAuth.
// Docs: https://developers.zoom.us/docs/internal-apps/s2s-oauth/
//
// Set ZOOM_MOCK=true in .env to skip the real Zoom API and generate a clearly
// marked DEMO link instead — useful for testing the booking flow before you
// have Zoom credentials.

const ZOOM_OAUTH_URL = "https://zoom.us/oauth/token";
const ZOOM_API_URL = "https://api.zoom.us/v2";

let cachedToken = null;
let tokenExpiresAt = 0;

const hasCredentials = () =>
  Boolean(process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET);

const getAccessToken = async () => {
  // Reuse the token until shortly before it expires
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const basic = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(
    `${ZOOM_OAUTH_URL}?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    { method: "POST", headers: { Authorization: `Basic ${basic}` } }
  );

  if (!response.ok) {
    throw new Error(`Zoom authentication failed (HTTP ${response.status}). Check your ZOOM_* values in .env`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
};

// Creates a scheduled Zoom meeting.
// date: "YYYY-MM-DD", startTime: "HH:MM" (clinic local time)
export const createZoomMeeting = async ({ topic, date, startTime, durationMinutes }) => {
  if (process.env.ZOOM_MOCK === "true") {
    const fakeId = String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000));
    return {
      meetingId: fakeId,
      joinUrl: `https://zoom.us/j/${fakeId}`,
      startUrl: `https://zoom.us/s/${fakeId}`,
      password: "demo123",
      isDemo: true,
    };
  }

  if (!hasCredentials()) {
    throw new Error(
      "Zoom is not configured. Add ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET to backend/.env (or set ZOOM_MOCK=true for demo links)."
    );
  }

  const token = await getAccessToken();

  const response = await fetch(`${ZOOM_API_URL}/users/me/meetings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      type: 2, // scheduled meeting
      start_time: `${date}T${startTime}:00`,
      duration: durationMinutes,
      timezone: process.env.ZOOM_TIMEZONE || "Asia/Kolkata",
      settings: {
        join_before_host: false,
        waiting_room: true,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Zoom meeting creation failed (HTTP ${response.status}): ${detail}`);
  }

  const meeting = await response.json();
  return {
    meetingId: String(meeting.id),
    joinUrl: meeting.join_url,
    startUrl: meeting.start_url,
    password: meeting.password || "",
    isDemo: false,
  };
};
