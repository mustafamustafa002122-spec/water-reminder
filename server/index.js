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

const curatedSeedMessages = [
  { title: "Jane Austen", body: "\"There is no charm equal to tenderness of heart.\" + one gentle sip." },
  { title: "Jane Austen", body: "\"Think only of the past as its remembrance gives you pleasure.\" Sip onward." },
  { title: "Jane Austen", body: "\"I declare after all there is no enjoyment like reading!\" Hydrate and read on." },
  { title: "Charlotte Bronte", body: "\"I am no bird; and no net ensnares me.\" Drink, then fly." },
  { title: "Charlotte Bronte", body: "\"Life appears to me too short to be spent in nursing animosity.\" Choose water." },
  { title: "James Joyce", body: "\"Mistakes are the portals of discovery.\" A sip is never a mistake." },
  { title: "Mark Twain", body: "\"The secret of getting ahead is getting started.\" Start with water." },
  { title: "Virginia Woolf", body: "\"No need to hurry. No need to sparkle.\" Just hydrate and continue." },
  { title: "Shakespeare", body: "\"To thine own self be true.\" Also, be true to hydration." },
  { title: "Emily Dickinson", body: "\"Forever is composed of nows.\" This now asks for a sip." },
  { title: "Oscar Wilde", body: "\"Be yourself; everyone else is already taken.\" So is this glass of water." },
  { title: "Literary wink", body: "Plot twist: the heroine paused, drank water, and won the chapter." },
  { title: "Teacher mode", body: "Hydrate now, explain brilliantly later." },
  { title: "Poetry pause", body: "Line break. Sip break." },
  { title: "Quiet brilliance", body: "A page, a quote, a sip. Repeat." },
];

const literarySnippets = [
  { author: "Jane Austen", quote: "\"There is no enjoyment like reading.\"" },
  { author: "Jane Austen", quote: "\"I must learn to be content with being happier than I deserve.\"" },
  { author: "Charlotte Bronte", quote: "\"I am no bird; and no net ensnares me.\"" },
  { author: "Charlotte Bronte", quote: "\"Life appears to me too short to be spent in nursing animosity.\"" },
  { author: "James Joyce", quote: "\"Mistakes are the portals of discovery.\"" },
  { author: "James Joyce", quote: "\"Think you're escaping and run into yourself.\"" },
  { author: "Mark Twain", quote: "\"The secret of getting ahead is getting started.\"" },
  { author: "Mark Twain", quote: "\"Good friends, good books, and a sleepy conscience.\"" },
  { author: "Virginia Woolf", quote: "\"No need to hurry. No need to sparkle.\"" },
  { author: "Virginia Woolf", quote: "\"Arrange whatever pieces come your way.\"" },
  { author: "Shakespeare", quote: "\"To thine own self be true.\"" },
  { author: "Shakespeare", quote: "\"All the world's a stage.\"" },
  { author: "Emily Dickinson", quote: "\"Forever is composed of nows.\"" },
  { author: "Emily Dickinson", quote: "\"Hope is the thing with feathers.\"" },
  { author: "T. S. Eliot", quote: "\"Only those who risk going too far can find out how far one can go.\"" },
  { author: "Oscar Wilde", quote: "\"Be yourself; everyone else is already taken.\"" },
  { author: "George Eliot", quote: "\"It is never too late to be what you might have been.\"" },
  { author: "Mary Shelley", quote: "\"Beware; for I am fearless, and therefore powerful.\"" },
  { author: "W. B. Yeats", quote: "\"There are no strangers here; only friends you haven't yet met.\"" },
  { author: "Samuel Beckett", quote: "\"Ever tried. Ever failed. No matter. Try again.\"" },
];

const hydratePrompts = [
  "Take one calm sip and keep going.",
  "A little water for a clearer sentence.",
  "Hydrate first, then annotate.",
  "Sip once before the next paragraph.",
  "A brief water pause, then brilliance.",
  "Let this be your gentle hydration cue.",
  "One sip for focus, one for calm.",
  "Drink water and return to the page.",
  "A tiny sip can rescue a long thought.",
  "Pause, breathe, sip, continue.",
];

const playfulClosers = [
  "Your water bottle approves.",
  "Main-character energy unlocked.",
  "The plot definitely improves after hydration.",
  "Scholarly elegance, now with extra water.",
  "Your thesis called; it said thanks.",
  "This is your intermission bell.",
  "Coffee is lovely; water is loyal.",
  "A sip today saves dramatic sighs later.",
  "The next idea is waiting right after this sip.",
  "Hydration is the quiet co-author.",
];

function buildReminderMessages(targetCount = 365) {
  const output = [];
  const seen = new Set();

  function addMessage(message) {
    const key = `${message.title}__${message.body}`;
    if (seen.has(key)) return;
    seen.add(key);
    output.push(message);
  }

  for (const message of curatedSeedMessages) {
    addMessage(message);
  }

  for (const snippet of literarySnippets) {
    for (const prompt of hydratePrompts) {
      for (const closer of playfulClosers) {
        if (output.length >= targetCount) break;
        addMessage({
          title: snippet.author,
          body: `${snippet.quote} ${prompt} ${closer}`,
        });
      }
      if (output.length >= targetCount) break;
    }
    if (output.length >= targetCount) break;
  }

  if (output.length < targetCount) {
    throw new Error(`Unable to build ${targetCount} unique reminder messages.`);
  }

  return output.slice(0, targetCount);
}

const reminderMessages = buildReminderMessages(365);

const lastMessageByEndpoint = new Map();

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickReminderMessage(endpoint = "") {
  const seed = hashString(`${endpoint}-${Date.now()}-${Math.random()}`);
  let index = seed % reminderMessages.length;
  const lastIndex = lastMessageByEndpoint.get(endpoint);

  // Avoid back-to-back repeats for the same subscription.
  if (lastIndex === index) {
    index = (index + 1) % reminderMessages.length;
  }

  lastMessageByEndpoint.set(endpoint, index);
  return reminderMessages[index];
}

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
        const message = pickReminderMessage(row.endpoint || "");
        await webpush.sendNotification(
          row.subscription,
          JSON.stringify({
            title: message.title,
            body: message.body,
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