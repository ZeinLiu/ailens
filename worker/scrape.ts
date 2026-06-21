import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const AUTH_DIR = path.join(__dirname, "auth");

function getAuthFile(url: string): string | null {
  const map: [RegExp, string][] = [
    [/bilibili\.com/, "bilibili.json"],
    [/douyin\.com/, "douyin.json"],
    [/xiaohongshu\.com|xhslink/, "xiaohongshu.json"],
  ];
  for (const [re, file] of map) {
    if (re.test(url)) {
      const full = path.join(AUTH_DIR, file);
      return fs.existsSync(full) ? full : null;
    }
  }
  return null;
}

export async function scrape(url: string): Promise<string> {
  const authFile = getAuthFile(url);
  const browser = await chromium.launch({ headless: true });

  const context = authFile
    ? await browser.newContext({ storageState: authFile })
    : await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });

  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    let content: string;

    if (/bilibili\.com/.test(url)) {
      await page.waitForSelector("h1", { timeout: 10000 }).catch(() => {});
      content = await page.evaluate(() => {
        const title = document.querySelector("h1")?.textContent?.trim() ?? "";
        const desc =
          document.querySelector(".video-desc-container, .desc-info-text")
            ?.textContent?.trim() ?? "";
        return `Title: ${title}\n\nDescription: ${desc}`;
      });
    } else if (/douyin\.com/.test(url)) {
      await page
        .waitForSelector("[data-e2e='video-desc']", { timeout: 10000 })
        .catch(() => {});
      content = await page.evaluate(() => {
        const desc =
          document
            .querySelector("[data-e2e='video-desc']")
            ?.textContent?.trim() ?? "";
        const title =
          document.querySelector("title")?.textContent?.trim() ?? "";
        return `Title: ${title}\n\nDescription: ${desc}`;
      });
    } else if (/xiaohongshu\.com|xhslink/.test(url)) {
      await page
        .waitForSelector(".note-content, .content", { timeout: 10000 })
        .catch(() => {});
      content = await page.evaluate(() => {
        const body =
          document
            .querySelector(".note-content, .content")
            ?.textContent?.trim() ?? document.body.innerText;
        return body;
      });
    } else {
      content = await page.evaluate(() => document.body.innerText);
    }

    return content.slice(0, 15000);
  } finally {
    await browser.close();
  }
}
