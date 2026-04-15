"use client";

import { useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function Home() {
  const [everyMinutes, setEveryMinutes] = useState(60);
  const [status, setStatus] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  async function enableReminders() {
    try {
      setStatus("Preparing your next lovely reminder...");

      if (!apiBase || !vapidPublicKey) {
        setStatus("A small setup detail is missing. Please try again in a moment.");
        return;
      }

      if (!("serviceWorker" in navigator)) {
        setStatus("This browser is not ready for these reminders yet.");
        return;
      }

      if (!window.isSecureContext) {
        setStatus("Please open the secure app link to continue.");
        return;
      }

      const reg = await navigator.serviceWorker.register("/service-worker.js");

      setStatus("Almost there... asking for notification permission.");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus("No worries. You can allow notifications any time from settings.");
        return;
      }

      setStatus("Setting your reading-and-hydration rhythm...");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      setStatus("Saving your reminder style...");
      const resp = await fetch(`${apiBase}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub,
          everyMinutes,
          windowStart: "09:00",
          windowEnd: "23:00",
          tz: "Europe/Istanbul",
        }),
      });

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setStatus("Something interrupted the setup. Please try once more.");
        return;
      }

      setStatus("Done. Your quote-filled water reminders are ready.");
    } catch (e) {
      setStatus("A brief hiccup happened. Please try again.");
    }
  }

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "40px auto",
        padding: 20,
        borderRadius: 20,
        border: "1px solid #f4d8df",
        background: "linear-gradient(180deg, #fff9fb 0%, #fff 100%)",
        boxShadow: "0 6px 30px rgba(255, 79, 129, 0.08)",
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 4 }}>💧 Zehra's Water Notes</h1>

      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Gentle hydration reminders with tiny literature and language sparks.
      </p>

      <label style={{ display: "block", marginTop: 16, fontWeight: 600 }}>
        Reminder every (minutes):
        <input
          type="number"
          min={5}
          step={5}
          value={everyMinutes}
          onChange={(e) => setEveryMinutes(Number(e.target.value))}
          style={{
            marginLeft: 12,
            width: 110,
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid #f2b8c8",
            background: "#fff",
          }}
        />
      </label>

      <button
        onClick={enableReminders}
        style={{
          marginTop: 16,
          padding: "11px 16px",
          cursor: "pointer",
          borderRadius: 10,
          border: "1px solid #ff8fb1",
          background: "#ff4f81",
          color: "#fff",
          fontWeight: 600,
        }}
      >
        Start reminders
      </button>

      <p style={{ marginTop: 12, minHeight: 24 }}>{status}</p>

      <hr style={{ marginTop: 24 }} />
      <p style={{ fontSize: 14, opacity: 0.8 }}>
        Open from your home screen and enjoy little literary nudges through the day.
      </p>
    </main>
  );
}