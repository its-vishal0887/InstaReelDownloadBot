const { Telegraf } = require("telegraf");
const express = require("express");
const fs = require("fs");
require("dotenv").config();

const downloadInstagram = require("./service/instagramDownloader");

const app = express();
const PORT = process.env.PORT || 3000;
const token = process.env.API_KEY;

if (!token) {
  console.error("❌ API_KEY missing in .env file");
  process.exit(1);
}

const bot = new Telegraf(token);

app.get("/", (req, res) => {
  res.send("Telegram Bot is running 🚀");
});

function getInstType(url) {
  try {
    const pathName = new URL(url).pathname;

    if (pathName.startsWith("/reel/")) return "reel";
    if (pathName.startsWith("/p/")) return "post";
    if (pathName.startsWith("/stories/")) return "story";

    return null;
  } catch (e) {
    return null; // invalid URL
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
    // Video bhejne ke baad ya error ke baad bhi file delete ho
    if (filepath && fs.existsSync(filepath)) {
      fs.promises.unlink(filepath).catch((err) =>
        console.error("File delete error:", err)
      );
    }
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

bot.launch()
  .then(() => console.log("Bot Started 🚀"))
  .catch((err) => {
    console.error("❌ Bot launch failed:", err.message);
    process.exit(1);
  });

// Graceful shutdown - Docker/nodemon restart pe "409 Conflict" error rokne ke liye
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));