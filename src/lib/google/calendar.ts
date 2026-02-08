import { google } from "googleapis";

// Google OAuth2 client
export function getGoogleOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  );
}

// Generate OAuth URL for calendar access
export function getGoogleAuthUrl(state?: string) {
  const oauth2Client = getGoogleOAuthClient();
  
  const scopes = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    state,
  });
}

// Exchange code for tokens
export async function getGoogleTokensFromCode(code: string) {
  const oauth2Client = getGoogleOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Refresh access token
export async function refreshGoogleToken(refreshToken: string) {
  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

// Get Google Calendar client
export function getCalendarClient(accessToken: string) {
  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

// Fetch calendar events
export async function fetchCalendarEvents(
  accessToken: string,
  calendarId: string = "primary",
  timeMin?: Date,
  timeMax?: Date,
  timeZone?: string
) {
  const calendar = getCalendarClient(accessToken);
  
  const response = await calendar.events.list({
    calendarId,
    timeMin: timeMin?.toISOString() || new Date().toISOString(),
    timeMax: timeMax?.toISOString(),
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    maxResults: 100,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}

// Create calendar event
export async function createCalendarEvent(
  accessToken: string,
  calendarId: string = "primary",
  event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    colorId?: string;
  }
) {
  const calendar = getCalendarClient(accessToken);
  
  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return response.data;
}

// Update calendar event
export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string = "primary",
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    start?: { dateTime: string; timeZone?: string };
    end?: { dateTime: string; timeZone?: string };
  }
) {
  const calendar = getCalendarClient(accessToken);
  
  const response = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: event,
  });

  return response.data;
}

// Delete calendar event
export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string = "primary",
  eventId: string
) {
  const calendar = getCalendarClient(accessToken);
  await calendar.events.delete({ calendarId, eventId });
}

// List available calendars
export async function listCalendars(accessToken: string) {
  const calendar = getCalendarClient(accessToken);
  const response = await calendar.calendarList.list();
  return response.data.items || [];
}

// Convert Google event to our format
export function convertGoogleEvent(event: any) {
  return {
    googleEventId: event.id,
    title: event.summary || "Untitled Event",
    description: event.description,
    start: event.start?.dateTime || event.start?.date,
    end: event.end?.dateTime || event.end?.date,
    allDay: !event.start?.dateTime,
    location: event.location,
    htmlLink: event.htmlLink,
    status: event.status,
    colorId: event.colorId,
    attendees: event.attendees?.map((a: any) => ({
      email: a.email,
      displayName: a.displayName,
      responseStatus: a.responseStatus,
    })),
  };
}
