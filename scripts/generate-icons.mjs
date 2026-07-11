import sharp from "sharp";
import { writeFileSync } from "fs";

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="80" fill="#1e293b"/>
  <path d="M256 80 L128 160 L256 240 L384 160 Z" fill="#f97316"/>
  <path d="M168 200 L168 300 C168 330 208 350 256 350 C304 350 344 330 344 300 L344 200 L256 250 Z" fill="#f97316"/>
  <path d="M400 190 L400 340" stroke="#f97316" stroke-width="12" fill="none" stroke-linecap="round"/>
  <circle cx="400" cy="360" r="10" fill="#f97316"/>
  <text x="256" y="430" text-anchor="middle" font-family="Arial" font-size="48" font-weight="bold" fill="white">EduWave</text>
</svg>`;

async function main() {
  await sharp(Buffer.from(svg)).resize(192, 192).png().toFile("public/icon-192x192.png");
  await sharp(Buffer.from(svg)).resize(512, 512).png().toFile("public/icon-512x512.png");
  console.log("Icons created successfully!");
}

main().catch(console.error);
