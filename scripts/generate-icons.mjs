import sharp from "sharp";
import { writeFileSync } from "fs";

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0A0A0A"/>
      <stop offset="0.55" stop-color="#1e3a8a"/>
      <stop offset="1" stop-color="#2A4DFF"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.28" cy="0.18" r="0.55">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="letter" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <rect width="512" height="512" rx="112" fill="url(#glow)"/>
  <path d="M 344 200
           C 344 128, 304 96, 256 96
           C 208 96, 168 128, 168 200
           C 168 240, 200 256, 256 256
           C 312 256, 344 272, 344 312
           C 344 384, 304 416, 256 416
           C 208 416, 168 384, 168 312"
        stroke="url(#letter)" stroke-width="56" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <text x="256" y="478" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="white">Safha</text>
</svg>`;

async function main() {
  await sharp(Buffer.from(svg)).resize(192, 192).png().toFile("public/icon-192x192.png");
  await sharp(Buffer.from(svg)).resize(512, 512).png().toFile("public/icon-512x512.png");
  console.log("Icons created successfully!");
}

main().catch(console.error);
