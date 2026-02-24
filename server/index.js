// server/index.js
import express from "express";
import cors from "cors";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

// Required env vars
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT,
  PORT
} = process.env;

function requireEnv(name) {
  if (!process.env[name]) {
    console.error(`Missing env var: ${name}`);
    process.exit(1);
  }
}

["SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","VAPID_PUBLIC_KEY","VAPID_PRIVATE_KEY","VAPID_SUBJECT"].forEach(requireEnv);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

webpush.setVapidDetails(
  VAPID_SUBJECT,          // e.g. "mailto:you@example.com"
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

app.get("/health", (req, res) => res.send("ok"));

// Register subscription + settings
app.post("/register", async (req, res) => {
  try {
    const {
      subscription,
      everyMinutes,
      windowStart = "09:00",
      windowEnd = "23:00",
      tz = "Europe/Istanbul"
    } = req.body || {};

    const endpoint = subscription?.endpoint;
    const every = Number(everyMinutes);

    if (!endpoint || !Number.isFinite(every) || every <= 0) {
      return res.status(400).json({ error: "Invalid subscription or everyMinutes" });
    }

    const nextSendAt = new Date(Date.now() + every * 60_000).toISOString();

    const { error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          endpoint,
          subscription,
          every_minutes: every,
          window_start: windowStart,
          window_end: windowEnd,
          tz,
          next_send_at: nextSendAt,
          active: true
        },
        { onConflict: "endpoint" }
      );

    if (error) return res.status(500).json({ error: error.message });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Simple window check (same-day)
function inWindow(hhmm, start, end) {
  return start <= end ? (hhmm >= start && hhmm <= end) : (hhmm >= start || hhmm <= end);
}

app.post("/send-due", async (req, res) => {
  try {
    const now = new Date();
    const nowIso = now.toISOString();
    const hhmmUtc = nowIso.substring(11, 16); // UTC; ok for MVP

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("active", true)
      .lte("next_send_at", nowIso)
      .limit(500);

    if (error) return res.status(500).json({ error: error.message });

    let sent = 0;
    for (const row of data || []) {
      // Respect quiet hours (MVP uses UTC; improve later if needed)
      if (!inWindow(hhmmUtc, row.window_start, row.window_end)) {
        await supabase
          .from("subscriptions")
          .update({ next_send_at: new Date(Date.now() + 5 * 60_000).toISOString() })
          .eq("id", row.id);
        continue;
      }

      try {
        await webpush.sendNotification(
          row.subscription,
          JSON.stringify({
            title: "💧 Water time",
            body: "Take a few sips ❤️",
            url: "/"
          })
        );

        sent++;

        await supabase
          .from("subscriptions")
          .update({ next_send_at: new Date(Date.now() + row.every_minutes * 60_000).toISOString() })
          .eq("id", row.id);
      } catch (e) {
        // Subscription expired/invalid -> disable
        await supabase.from("subscriptions").update({ active: false }).eq("id", row.id);
      }
    }

    res.json({ ok: true, due: (data || []).length, sent });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(Number(PORT) || 3000, () => {
  console.log(`API listening on ${Number(PORT) || 3000}`);
});