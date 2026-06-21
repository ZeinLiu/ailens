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

      // Try to fetch CC subtitles via Bilibili player API (works for creator-uploaded subtitles)
      const bvidMatch = url.match(/BV[a-zA-Z0-9]+/);
      const bvid = bvidMatch?.[0] ?? null;
      let transcript = "";

      if (bvid) {
        transcript = await page.evaluate(async (bvid: string) => {
          try {
            const viewRes = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
            const viewData = await viewRes.json();
            const cid: number = viewData?.data?.cid;
            if (!cid) return "";

            const playerRes = await fetch(`https://api.bilibili.com/x/player/v2?cid=${cid}&bvid=${bvid}`);
            const playerData = await playerRes.json();
            const subtitles: { lan_doc: string; subtitle_url: string }[] =
              playerData?.data?.subtitle?.subtitles ?? [];
            if (subtitles.length === 0) return "";

            // Prefer Chinese subtitle
            const sub =
              subtitles.find((s) => s.lan_doc?.includes("中")) ?? subtitles[0];
            const subUrl = sub.subtitle_url.startsWith("//")
              ? `https:${sub.subtitle_url}`
              : sub.subtitle_url;

            const subRes = await fetch(subUrl);
            const subData = await subRes.json();
            return (subData?.body ?? [])
              .map((item: { content: string }) => item.content)
              .join("\n");
          } catch {
            return "";
          }
        }, bvid);
      }

      const titleDesc = await page.evaluate(() => {
        const title = document.querySelector("h1")?.textContent?.trim() ?? "";
        const desc =
          document.querySelector(".video-desc-container, .desc-info-text")
            ?.textContent?.trim() ?? "";
        return { title, desc };
      });

      content = transcript
        ? `Title: ${titleDesc.title}\n\nDescription: ${titleDesc.desc}\n\nTranscript:\n${transcript}`
        : `Title: ${titleDesc.title}\n\nDescription: ${titleDesc.desc}`;
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
