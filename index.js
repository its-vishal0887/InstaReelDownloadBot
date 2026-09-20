const { Telegraf } = require("telegraf");
const express = require("express");
const fs = require("fs");
require("dotenv").config();

const downloadInstagram = require("./service/instagramDownloader");

const app = express();
const PORT = process.env.PORT || 3000;
const token = process.env.API_KEY;
const domain = process.env.RENDER_EXTERNAL_URL; // Render automatically ye set karta hai

if (!token) {
  console.error("❌ API_KEY missing in .env file");
  process.exit(1);
}

const bot = new Telegraf(token);

app.use(express.json());

function getInstType(url) {
  try {
    const pathName = new URL(url).pathname;
    if (pathName.startsWith("/reel/")) return "reel";
    if (pathName.startsWith("/p/")) return "post";
    if (pathName.startsWith("/stories/")) return "story";
    return null;
  } catch (e) {
    return null;
  }
}

bot.start((ctx) => ctx.reply("Send me an Instagram video URL 🔗"));

bot.on("text", async (ctx) => {
  const url = ctx.message.text.trim();

  if (!url.includes("instagram.com")) {
    return ctx.reply("Please send a valid IG URL");
  }

  const type = getInstType(url);

  if (!type) {
    return ctx.reply("⚠️ Ye link samajh nahi aaya. Reel ya Post ka link bhejo.");
  }

  if (type === "story") {
    return ctx.reply("⚠️ Stories download abhi supported nahi hai (login required hota hai).");
  }

  let filepath;

  try {
    await ctx.reply("⌛ Downloading your video...");
    filepath = await downloadInstagram(url);
    console.log("File:", filepath);

    await ctx.replyWithVideo({ source: fs.createReadStream(filepath) });
    console.log("Video sent successfully");
  } catch (e) {
    console.error("Download failed:", e);
    await ctx.reply("🙅‍♂️ Sorry, I couldn't download this video");
  } finally {
    if (filepath && fs.existsSync(filepath)) {
      fs.promises.unlink(filepath).catch((err) =>
        console.error("File delete error:", err)
      );
    }
  }
});

// Health check route
app.get("/", (req, res) => {
  res.send("Telegram Bot is running 🚀");
});

// Webhook route - Telegram yahan updates bhejega
app.use(bot.webhookCallback("/telegram-webhook"));

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on port ${PORT}`);

  if (domain) {
    try {
      await bot.telegram.setWebhook(`${domain}/telegram-webhook`);
      console.log(`✅ Webhook set to: ${domain}/telegram-webhook`);
    } catch (err) {
      console.error("❌ Webhook set failed:", err.message);
    }
  } else {
    console.warn("⚠️ RENDER_EXTERNAL_URL not found — webhook set nahi ho paya");
  }
});

process.once("SIGINT", () => {
  bot.telegram.deleteWebhook().catch(() => {});
  process.exit(0);
});
process.once("SIGTERM", () => {
  bot.telegram.deleteWebhook().catch(() => {});
  process.exit(0);
});