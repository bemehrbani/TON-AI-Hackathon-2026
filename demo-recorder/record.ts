import { chromium } from "playwright";

(async () => {
  console.log("🎥 [Playwright] Launching browser...");
  const browser = await chromium.launchPersistentContext("./telegram-session", {
    headless: true,
    args: ['--disable-gpu', '--no-sandbox'],
    recordVideo: { dir: "./demo-video" },
    viewport: { width: 1280, height: 720 },
  });
  
  const page = browser.pages()[0] || await browser.newPage();

  // ─── PART 1: Bot Demo (Track 2) ────────────────────────────
  console.log("🚀 [Playwright] Navigating to Telegram Web -> @OntonAgentBot...");
  await page.goto("https://web.telegram.org/a/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DOntonAgentBot");
  await page.waitForTimeout(6000);

  try {
    console.log("🤖 [Playwright] Interacting with Bot (Track 2)...");
    
    // Click START if needed (new conversation)
    try {
      const startButton = page.locator('text="START"').first();
      await startButton.click({ timeout: 3000 });
      console.log("Clicked START.");
      await page.waitForTimeout(4000);
    } catch (e) {
      console.log("No START button, chat already active.");
    }
    
    // Find chat input (Telegram Web A)
    const chatInput = page.locator('#message-input-text');
    await chatInput.click({ timeout: 10000 });
    
    // Query 1: Real wallet with actual data
    console.log("Typing: Reputation lookup (real wallet)...");
    await page.keyboard.type("What is the reputation for wallet EQDyjLJrFbIbHEPhZtYV23Xwwqg7JH2B8VHQiIp3F0bzCvF7?");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(15000); // Wait for DeepSeek + API response

    // Query 2: Events
    console.log("Typing: Event query...");
    await page.keyboard.type("Show me the latest offline events");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(15000);

    // Query 3: Leaderboard
    console.log("Typing: Leaderboard query...");
    await page.keyboard.type("Show the leaderboard");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(12000);

  } catch (error: any) {
    console.log("⚠️ Could not auto-type. Waiting 30s for manual interaction...");
    await page.waitForTimeout(30000);
  }

  // ─── PART 2: API Demo (Track 1) ────────────────────────────
  console.log("🌐 [Playwright] Showcasing API Infrastructure (Track 1)...");
  
  // Show reputation endpoint with real data
  await page.goto("http://localhost:3100/v1/reputation/EQDyjLJrFbIbHEPhZtYV23Xwwqg7JH2B8VHQiIp3F0bzCvF7");
  await page.waitForTimeout(5000);
  
  // Show leaderboard
  await page.goto("http://localhost:3100/v1/leaderboard?limit=5");
  await page.waitForTimeout(5000);
  
  // Show events
  await page.goto("http://localhost:3100/v1/events?limit=3");
  await page.waitForTimeout(5000);

  // Show health
  await page.goto("http://localhost:3100/health");
  await page.waitForTimeout(3000);

  console.log("✅ [Playwright] Closing browser and exporting video...");
  await browser.close();
  console.log("🎉 Video saved successfully in ./demo-video folder!");
})();
