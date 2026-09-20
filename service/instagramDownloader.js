const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const ytDLPpath = process.env.YTDLP_PATH || "yt-dlp";

const downloadDir = path.join(__dirname, "..", "downloads");

if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

function downloadInstagram(url) {
  return new Promise((res, rej) => {
    const op = path.join(downloadDir, "%(id)s.%(ext)s");

    execFile(
      ytDLPpath,
      [
        "--no-playlist",
        "-f", "bv*+ba/b",
        "--merge-output-format", "mp4",
        "-o", op,
        "--print", "after_move:filepath",
        url
      ],
      { timeout: 60000 }, // 60 sec timeout - hang na ho jaaye
      (error, stdout, stderr) => {
        if (error) {
          console.error("yt-dlp error:", stderr || error.message);
          return rej(new Error(stderr || error.message));
        }

        const lines = stdout.trim().split("\n").filter(Boolean);
        const filepath = lines[lines.length - 1];

        if (!filepath || !fs.existsSync(filepath)) {
          return rej(new Error("Download hua lekin file path nahi mila"));
        }

        res(filepath);
      }
    );
  });
}

module.exports = downloadInstagram;