import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { requireAuth } from "../lib/auth.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const UPLOAD_DIR = path.join(ROOT, "public", "uploads");
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB — Vercel Hobby body limit is ~4.5 MB
const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

// Verify the file's magic bytes actually match its declared MIME type,
// so a renamed executable can't sneak through with an image Content-Type.
function magicBytesMatch(type, data) {
  if (data.length < 12) return false;
  switch (type) {
    case "image/jpeg": return data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF;
    case "image/png":  return data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
    case "image/gif":  return data.subarray(0, 3).toString("ascii") === "GIF";
    case "image/webp": return data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP";
    default: return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }
  return requireAuth(async (req, res) => {
    // Parse JSON body (base64-encoded image data)
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    if (!body || !body.data || !body.contentType || !body.filename) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Missing image data" }));
    }

    const contentType = String(body.contentType).toLowerCase();
    if (!ALLOWED_TYPES[contentType]) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Only JPG, PNG, WebP, and GIF images are supported" }));
    }

    let data;
    try {
      data = Buffer.from(body.data, "base64");
    } catch {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Invalid image data" }));
    }

    if (!data.length) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Empty image data" }));
    }
    if (data.length > MAX_BYTES) {
      res.statusCode = 413;
      return res.end(JSON.stringify({ error: "Images must be 4 MB or smaller" }));
    }
    if (!magicBytesMatch(contentType, data)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "File contents don't match the image type" }));
    }

    const base = path.basename(String(body.filename), path.extname(String(body.filename))).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "image";
    const filename = `${base}-${Date.now()}-${randomBytes(4).toString("hex")}${ALLOWED_TYPES[contentType]}`;

    let url;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Production (Vercel): persist to Vercel Blob — the serverless filesystem is ephemeral.
      const { put } = await import("@vercel/blob");
      const blob = await put(`uploads/${filename}`, data, { access: "public", contentType });
      url = blob.url;
    } else {
      // Local dev: write to public/uploads/ and serve statically.
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await fs.writeFile(path.join(UPLOAD_DIR, filename), data);
      url = `/uploads/${filename}`;
    }
    res.statusCode = 201;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ url }));
  })(req, res);
}
