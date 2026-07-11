/**
 * Build script for EduWave APK
 * 
 * Usage:
 *   node scripts/build-apk.mjs          # Build APK (requires Android SDK)
 *   node scripts/build-apk.mjs --sync   # Only sync web to Capacitor
 * 
 * Prerequisites:
 *   - Java JDK 17+
 *   - Android Studio with Android SDK
 *   - ANDROID_HOME environment variable set
 */

import { execSync } from "child_process";
import { existsSync } from "fs";

const args = process.argv.slice(2);
const mode = args.includes("--sync") ? "sync" : "full";

console.log("=== EduWave APK Builder ===");
console.log(`Mode: ${mode}\n`);

// 1. Build Next.js
console.log("1/3 Building Next.js...");
execSync("npx next build", { stdio: "inherit", cwd: process.cwd() + "/.." });

// 2. Copy build to dist for Capacitor
console.log("\n2/3 Preparing Capacitor assets...");
if (!existsSync(".next/standalone")) {
  // For dynamic apps, we copy the relevant static files
  execSync("xcopy .next\\static ..\\android\\app\\src\\main\\assets\\public\\_next\\static /E /I /Y", { stdio: "inherit" });
}

// 3. Sync with Capacitor
console.log("\n3/3 Syncing Capacitor...");
execSync("npx cap sync android", { stdio: "inherit", cwd: process.cwd() + "/.." });

if (mode === "full") {
  console.log("\n=== Opening Android Studio ===");
  console.log("Run the following command to open in Android Studio:");
  console.log("  npx cap open android");
  console.log("\nThen in Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)");
} else {
  console.log("\n=== Sync Complete ===");
  console.log("Run 'npx cap open android' to open Android Studio");
  console.log("Or run 'cd android && ./gradlew assembleDebug' to build APK directly");
}
