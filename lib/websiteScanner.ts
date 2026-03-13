import type { WebsiteSignals } from "@/lib/types";
import { env } from "@/lib/env";

interface ScannerInput {
  url: string;
  fallbackSignals: WebsiteSignals;
}

export async function scanWebsite({ url, fallbackSignals }: ScannerInput): Promise<WebsiteSignals> {
  if (!url || url === "No website") {
    return fallbackSignals;
  }

  if (!env.enableLiveScan) {
    return fallbackSignals;
  }

  try {
    const { chromium } = await import("playwright");
    const cheerio = await import("cheerio");

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 }
    });

    const start = Date.now();
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 12000
    });
    const loadTimeMs = Date.now() - start;
    const html = await page.content();
    const $ = cheerio.load(html);

    const brokenLinks = await page.evaluate(async () => {
      const anchors = Array.from(document.querySelectorAll("a[href]"))
        .flatMap((anchor) => {
          const href = anchor.getAttribute("href");
          return href && href.startsWith("http") ? [href] : [];
        })
        .slice(0, 8);

      let broken = 0;
      for (const href of anchors) {
        try {
          const res = await fetch(href, { method: "HEAD" });
          if (res.status >= 400) broken += 1;
        } catch {
          broken += 1;
        }
      }
      return broken;
    });

    const copyrightText = $("body").text().match(/20\d{2}/g)?.map(Number).sort().pop();
    const bodyHtml = $.html();

    await browser.close();

    return {
      pageTitle: $("title").text() || undefined,
      metaDescription: $('meta[name="description"]').attr("content"),
      hasSsl: url.startsWith("https://") || response?.url().startsWith("https://") || false,
      hasViewport: $('meta[name="viewport"]').length > 0,
      brokenLinks,
      loadTimeMs,
      hasBookingFlow: /book|schedule|appointment|reserve/i.test(bodyHtml),
      hasChatWidget: /intercom|drift|tawk|chat/i.test(bodyHtml),
      hasAnalytics: /gtag|google-analytics|googletagmanager|plausible/i.test(bodyHtml),
      copyrightYear: copyrightText,
      hasWebsite: true
    };
  } catch {
    return fallbackSignals;
  }
}
