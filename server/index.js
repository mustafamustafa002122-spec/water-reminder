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

[
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT"
].forEach(requireEnv);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const curatedSeedMessages = [
  { title: "Jane Austen", body: "\"There is no charm equal to tenderness of heart.\" + one gentle sip." },
  { title: "Jane Austen", body: "\"Think only of the past as its remembrance gives you pleasure.\" Sip onward." },
  { title: "Jane Austen", body: "\"I declare after all there is no enjoyment like reading!\" Hydrate and read on." },
  { title: "Charlotte Bronte", body: "\"I am no bird; and no net ensnares me.\" Drink, then fly." },
  { title: "Charlotte Bronte", body: "\"Life appears to me too short to be spent in nursing animosity.\" Choose water." },
  { title: "Virginia Woolf", body: "\"No need to hurry. No need to sparkle.\" Just hydrate and continue." },
  { title: "Shakespeare", body: "\"To thine own self be true.\" Also, be true to hydration." },
  { title: "Oscar Wilde", body: "\"Be yourself; everyone else is already taken.\" So is this glass of water." },
  { title: "Mary Shelley", body: "\"Beware; for I am fearless, and therefore powerful.\" Sip fearlessly." },
  { title: "George Orwell", body: "\"To see what is in front of one's nose needs a constant struggle.\" Start with water." },
  { title: "Literary wink", body: "Plot twist: the heroine paused, drank water, and won the chapter." },
  { title: "Teacher mode", body: "Hydrate now, explain brilliantly later." },
  { title: "Poetry pause", body: "Line break. Sip break." },
  { title: "Quiet brilliance", body: "A page, a quote, a sip. Repeat." },
];

// Full quote pools from the uploaded doc
const ukAuthorQuotes = [
  { author: "Jane Austen", quote: "\"There is no enjoyment like reading.\"" },
  { author: "Jane Austen", quote: "\"Think only of the past as its remembrance gives you pleasure.\"" },
  { author: "Jane Austen", quote: "\"Life seems but a quick succession of busy nothings.\"" },
  { author: "Jane Austen", quote: "\"There is nothing like staying at home for real comfort.\"" },
  { author: "Jane Austen", quote: "\"If adventures will not befall a young lady in her own village, she must seek them abroad.\"" },
  { author: "Jane Austen", quote: "\"One half of the world cannot understand the pleasures of the other.\"" },

  { author: "Virginia Woolf", quote: "\"No need to hurry. No need to sparkle.\"" },
  { author: "Virginia Woolf", quote: "\"Arrange whatever pieces come your way.\"" },
  { author: "Virginia Woolf", quote: "\"You cannot find peace by avoiding life.\"" },
  { author: "Virginia Woolf", quote: "\"Books are the mirrors of the soul.\"" },
  { author: "Virginia Woolf", quote: "\"Lock up your libraries if you like; there is no gate, no lock upon the freedom of my mind.\"" },
  { author: "Virginia Woolf", quote: "\"I am rooted, but I flow.\"" },

  { author: "William Shakespeare", quote: "\"To thine own self be true.\"" },
  { author: "William Shakespeare", quote: "\"All the world's a stage.\"" },
  { author: "William Shakespeare", quote: "\"We know what we are, but know not what we may be.\"" },
  { author: "William Shakespeare", quote: "\"The better part of valour is discretion.\"" },
  { author: "William Shakespeare", quote: "\"Brevity is the soul of wit.\"" },
  { author: "William Shakespeare", quote: "\"Our doubts are traitors.\"" },

  { author: "Charles Dickens", quote: "\"It was the best of times, it was the worst of times.\"" },
  { author: "Charles Dickens", quote: "\"No one is useless in this world who lightens the burden of another.\"" },
  { author: "Charles Dickens", quote: "\"We forge the chains we wear in life.\"" },
  { author: "Charles Dickens", quote: "\"There are books of which the backs and covers are by far the best parts.\"" },
  { author: "Charles Dickens", quote: "\"Have a heart that never hardens.\"" },
  { author: "Charles Dickens", quote: "\"A loving heart is the truest wisdom.\"" },

  { author: "George Orwell", quote: "\"Freedom is the freedom to say that two plus two make four.\"" },
  { author: "George Orwell", quote: "\"In a time of deceit telling the truth is a revolutionary act.\"" },
  { author: "George Orwell", quote: "\"To see what is in front of one's nose needs a constant struggle.\"" },
  { author: "George Orwell", quote: "\"Happiness can exist only in acceptance.\"" },
  { author: "George Orwell", quote: "\"If liberty means anything at all, it means the right to tell people what they do not want to hear.\"" },

  { author: "Oscar Wilde", quote: "\"Be yourself; everyone else is already taken.\"" },
  { author: "Oscar Wilde", quote: "\"We are all in the gutter, but some of us are looking at the stars.\"" },
  { author: "Oscar Wilde", quote: "\"To live is the rarest thing in the world.\"" },
  { author: "Oscar Wilde", quote: "\"Experience is simply the name we give our mistakes.\"" },
  { author: "Oscar Wilde", quote: "\"Life imitates art far more than art imitates life.\"" },

  { author: "T. S. Eliot", quote: "\"Only those who risk going too far can find out how far one can go.\"" },
  { author: "T. S. Eliot", quote: "\"We shall not cease from exploration.\"" },
  { author: "T. S. Eliot", quote: "\"For us, there is only the trying.\"" },
  { author: "T. S. Eliot", quote: "\"Every moment is a fresh beginning.\"" },

  { author: "Mary Shelley", quote: "\"Beware; for I am fearless, and therefore powerful.\"" },
  { author: "Mary Shelley", quote: "\"Nothing is so painful to the human mind as a great and sudden change.\"" },
  { author: "Mary Shelley", quote: "\"Life, although it may only be an accumulation of anguish, is dear to me.\"" },

  { author: "George Eliot", quote: "\"It is never too late to be what you might have been.\"" },
  { author: "George Eliot", quote: "\"What do we live for, if not to make life less difficult for each other?\"" },
  { author: "George Eliot", quote: "\"Our deeds determine us, as much as we determine our deeds.\"" },

  { author: "Emily Bronte", quote: "\"Whatever our souls are made of, his and mine are the same.\"" },
  { author: "Emily Bronte", quote: "\"Proud people breed sad sorrows for themselves.\"" },
  { author: "Emily Bronte", quote: "\"I wish I were a girl again, half-savage and hardy.\"" },

  { author: "Charlotte Bronte", quote: "\"I am no bird; and no net ensnares me.\"" },
  { author: "Charlotte Bronte", quote: "\"Life appears to me too short to be spent in nursing animosity.\"" },
  { author: "Charlotte Bronte", quote: "\"A ruffled mind makes a restless pillow.\"" },
  { author: "Charlotte Bronte", quote: "\"Hope smiles from the threshold of the year to come.\"" },

  { author: "John Keats", quote: "\"A thing of beauty is a joy forever.\"" },
  { author: "John Keats", quote: "\"I am certain of nothing but the holiness of the heart's affections.\"" },
  { author: "John Keats", quote: "\"Heard melodies are sweet, but those unheard are sweeter.\"" },

  { author: "William Wordsworth", quote: "\"Fill your paper with the breathings of your heart.\"" },
  { author: "William Wordsworth", quote: "\"Come forth into the light of things.\"" },
  { author: "William Wordsworth", quote: "\"To begin, begin.\"" },

  { author: "Samuel Beckett", quote: "\"Ever tried. Ever failed. No matter. Try again.\"" },
  { author: "Samuel Beckett", quote: "\"Fail again. Fail better.\"" },

  { author: "Agatha Christie", quote: "\"The best time for planning a book is while you are doing the dishes.\"" },
  { author: "Agatha Christie", quote: "\"Very few of us are what we seem.\"" },

  { author: "J. K. Rowling", quote: "\"It is our choices that show what we truly are.\"" },
  { author: "J. K. Rowling", quote: "\"Happiness can be found, even in the darkest of times.\"" },

  { author: "Kazuo Ishiguro", quote: "\"What is pertinent is the calmness of that beauty.\"" },
  { author: "Kazuo Ishiguro", quote: "\"Memories, even your most precious ones, fade surprisingly quickly.\"" },

  { author: "Philip Larkin", quote: "\"What will survive of us is love.\"" },
  { author: "Seamus Heaney", quote: "\"Walk on air against your better judgement.\"" },
  { author: "Lord Byron", quote: "\"There is pleasure in the pathless woods.\"" },
  { author: "Samuel Johnson", quote: "\"Great works are performed not by strength but by perseverance.\"" },
  { author: "E. M. Forster", quote: "\"Only connect.\"" },
  { author: "Daphne du Maurier", quote: "\"Happiness is not a possession to be prized, it is a quality of thought.\"" },
];

const ukBookQuotes = [
  { title: "Pride and Prejudice", author: "Jane Austen", quote: "\"I declare after all there is no enjoyment like reading!\"" },
  { title: "Emma", author: "Jane Austen", quote: "\"If I loved you less, I might be able to talk about it more.\"" },
  { title: "Persuasion", author: "Jane Austen", quote: "\"My idea of good company is the company of clever, well-informed people.\"" },
  { title: "Mrs Dalloway", author: "Virginia Woolf", quote: "\"She always had the feeling that it was very, very dangerous to live.\"" },
  { title: "A Room of One's Own", author: "Virginia Woolf", quote: "\"A woman must have money and a room of her own.\"" },
  { title: "To the Lighthouse", author: "Virginia Woolf", quote: "\"What is the meaning of life? That was all - a simple question.\"" },
  { title: "Hamlet", author: "William Shakespeare", quote: "\"There is nothing either good or bad, but thinking makes it so.\"" },
  { title: "As You Like It", author: "William Shakespeare", quote: "\"All the world's a stage.\"" },
  { title: "Julius Caesar", author: "William Shakespeare", quote: "\"The fault, dear Brutus, is not in our stars, but in ourselves.\"" },
  { title: "Great Expectations", author: "Charles Dickens", quote: "\"Take nothing on its looks; take everything on evidence.\"" },
  { title: "A Tale of Two Cities", author: "Charles Dickens", quote: "\"It was the best of times, it was the worst of times.\"" },
  { title: "David Copperfield", author: "Charles Dickens", quote: "\"Never be mean in anything; never be false; never be cruel.\"" },
  { title: "1984", author: "George Orwell", quote: "\"Who controls the past controls the future.\"" },
  { title: "Animal Farm", author: "George Orwell", quote: "\"All animals are equal, but some animals are more equal than others.\"" },
  { title: "Keep the Aspidistra Flying", author: "George Orwell", quote: "\"The very concept of objective truth is fading out of the world.\"" },
  { title: "The Picture of Dorian Gray", author: "Oscar Wilde", quote: "\"To define is to limit.\"" },
  { title: "The Importance of Being Earnest", author: "Oscar Wilde", quote: "\"The truth is rarely pure and never simple.\"" },
  { title: "The Waste Land", author: "T. S. Eliot", quote: "\"These fragments I have shored against my ruins.\"" },
  { title: "Four Quartets", author: "T. S. Eliot", quote: "\"In my end is my beginning.\"" },
  { title: "Frankenstein", author: "Mary Shelley", quote: "\"Beware; for I am fearless, and therefore powerful.\"" },
  { title: "Middlemarch", author: "George Eliot", quote: "\"What do we live for, if not to make life less difficult for each other?\"" },
  { title: "Wuthering Heights", author: "Emily Bronte", quote: "\"He's more myself than I am.\"" },
  { title: "Jane Eyre", author: "Charlotte Bronte", quote: "\"I am no bird; and no net ensnares me.\"" },
  { title: "Villette", author: "Charlotte Bronte", quote: "\"Life is so constructed, that the event does not, cannot, will not, match the expectation.\"" },
  { title: "Ode on a Grecian Urn", author: "John Keats", quote: "\"Heard melodies are sweet, but those unheard are sweeter.\"" },
  { title: "Endymion", author: "John Keats", quote: "\"A thing of beauty is a joy forever.\"" },
  { title: "The Prelude", author: "William Wordsworth", quote: "\"Bliss was it in that dawn to be alive.\"" },
  { title: "Waiting for Godot", author: "Samuel Beckett", quote: "\"Nothing to be done.\"" },
  { title: "Harry Potter and the Chamber of Secrets", author: "J. K. Rowling", quote: "\"It is our choices that show what we truly are.\"" },
  { title: "Never Let Me Go", author: "Kazuo Ishiguro", quote: "\"Memories, even your most precious ones, fade surprisingly quickly.\"" },
  { title: "Howards End", author: "E. M. Forster", quote: "\"Only connect.\"" },
  { title: "Rebecca", author: "Daphne du Maurier", quote: "\"Last night I dreamt I went to Manderley again.\"" },
  { title: "The Remains of the Day", author: "Kazuo Ishiguro", quote: "\"What dignity is there in that?\"" },
];

const ukShortQuotes = [
  { author: "Shakespeare", quote: "\"Be true.\"" },
  { author: "Woolf", quote: "\"No need to hurry.\"" },
  { author: "Austen", quote: "\"Read and breathe.\"" },
  { author: "Orwell", quote: "\"Choose truth.\"" },
  { author: "Dickens", quote: "\"Begin kindly.\"" },
  { author: "Eliot", quote: "\"Keep exploring.\"" },
  { author: "Wilde", quote: "\"Stay wonderfully yourself.\"" },
  { author: "Bronte", quote: "\"Drink, then rise.\"" },
  { author: "Keats", quote: "\"Beauty remains.\"" },
  { author: "Beckett", quote: "\"Try again.\"" },
  { author: "Forster", quote: "\"Only connect.\"" },
  { author: "Shelley", quote: "\"Be fearless.\"" },
  { author: "Wordsworth", quote: "\"Begin in light.\"" },
  { author: "Rowling", quote: "\"Choose well.\"" },
  { author: "Heaney", quote: "\"Walk on air.\"" },
  { author: "Larkin", quote: "\"Love lasts.\"" },
];

const literarySnippets = [
  ...ukAuthorQuotes.map(({ author, quote }) => ({
    author,
    quote,
  })),
  ...ukBookQuotes.map(({ title, author, quote }) => ({
    author: `${author} - ${title}`,
    quote,
  })),
  ...ukShortQuotes.map(({ author, quote }) => ({
    author,
    quote,
  })),
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
  VAPID_SUBJECT, // e.g. "mailto:you@example.com"
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
        await supabase
          .from("subscriptions")
          .update({ active: false })
          .eq("id", row.id);
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

app.get("/version", (req, res) => {
  res.json({
    version: "bd2d93f",
    literarySnippetsCount: literarySnippets.length,
    reminderMessagesCount: reminderMessages.length,
    sampleTitles: reminderMessages.slice(0, 5).map((m) => m.title),
  });
});

app.get("/test-message", (req, res) => {
  const message = pickReminderMessage("debug-endpoint");
  res.json(message);
});