/* eslint-disable */
// ─────────────────────────────────────────────────────────────
// useGoogleCalendar.js
// Hook för Google Calendar OAuth och event-hämtning.
//
// Kräver att användaren har ett Google Cloud-projekt med:
//   1. Google Calendar API aktiverat
//   2. OAuth 2.0 Client ID (Web application)
//   3. Auktoriserade JavaScript-origins: http://localhost:3000
//
// Hur man skapar ett Client ID:
//   console.cloud.google.com → APIs & Services → Credentials → Create credentials → OAuth client ID
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";

const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

export default function useGoogleCalendar(clientId) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tokenClient, setTokenClient] = useState(null);

  // Hämta dagens och kommande events (7 dagar)
  const fetchEvents = useCallback(async () => {
    if (!window.gapi?.client?.calendar) return;
    setLoading(true);
    try {
      const now = new Date();
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const response = await window.gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin: now.toISOString(),
        timeMax: weekLater.toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 30,
        orderBy: "startTime",
      });

      // Omvandla Google-format till appens format
      const items = (response.result.items || []).map(ev => ({
        id: ev.id,
        time: ev.start.dateTime
          ? new Date(ev.start.dateTime).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
          : "Heldag",
        title: ev.summary || "Ingen titel",
        who: ev.organizer?.displayName || "",
        date: (ev.start.dateTime || ev.start.date || "").slice(0, 10),
        color: "#2A5FA8",
      }));

      setEvents(items);
      setError(null);
    } catch (e) {
      if (e.status === 401) {
        // Token utgången — koppla ifrån
        disconnect();
      } else {
        setError("Kunde inte hämta events: " + e.message);
      }
    } finally {
      setLoading(false);
    }
  }, []); // fetchEvents definieras en gång och ändras inte

  // Ladda gapi och initiera
  useEffect(() => {
    if (!clientId || !window.gapi) return;

    window.gapi.load("client", async () => {
      try {
        await window.gapi.client.init({
          discoveryDocs: [DISCOVERY_DOC],
        });
        // Kolla om vi redan har en sparad token
        const savedToken = localStorage.getItem("fp_gcal_token");
        if (savedToken) {
          window.gapi.client.setToken(JSON.parse(savedToken));
          setConnected(true);
          fetchEvents();
        }
      } catch (e) {
        setError("Kunde inte initiera Google API: " + e.message);
      }
    });
  }, [clientId, fetchEvents]);

  // Sätt upp token client (GIS)
  useEffect(() => {
    if (!clientId || !window.google?.accounts?.oauth2) return;

    const tc = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: async (response) => {
        if (response.error) {
          setError("Inloggning misslyckades: " + response.error);
          return;
        }
        // Spara token lokalt
        localStorage.setItem("fp_gcal_token", JSON.stringify(window.gapi.client.getToken()));
        setConnected(true);
        await fetchEvents();
      },
    });
    setTokenClient(tc);
  }, [clientId, fetchEvents]);

  // Koppla ifrån och rensa token
  const disconnect = useCallback(() => {
    const token = window.gapi?.client?.getToken();
    if (token) {
      window.google?.accounts?.oauth2?.revoke(token.access_token);
      window.gapi.client.setToken(null);
    }
    localStorage.removeItem("fp_gcal_token");
    setConnected(false);
    setEvents([]);
  }, []);

  // Starta OAuth-flödet
  const connect = useCallback(() => {
    if (!tokenClient) {
      setError("Google API inte redo ännu — försök igen om ett ögonblick");
      return;
    }
    if (!window.gapi?.client?.getToken()) {
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      tokenClient.requestAccessToken({ prompt: "" });
    }
  }, [tokenClient]);

  return { connected, events, loading, error, connect, disconnect, refresh: fetchEvents };
}
