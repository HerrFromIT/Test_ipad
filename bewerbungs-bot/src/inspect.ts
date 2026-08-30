#!/usr/bin/env node
/**
 * Öffnet eine URL und listet Formularfelder / mailto-Links.
 * Nutzung: npm run inspect -- https://karriere.beispiel.de/jobs/123
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolveDomainProfile, parseMailto } from './lib/domain-profiles.js';

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: npm run inspect -- <url>');
    process.exit(1);
  }

  await mkdir('artifacts', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(2000);

  const profile = resolveDomainProfile(page.url());
  console.log('URL:', page.url());
  console.log('Domain-Profil:', profile?.hostIncludes ?? '(keins)');
  console.log('Kanal:', profile?.channel ?? 'unknown');

  const mailtos = await page.locator('a[href^="mailto:"]').evaluateAll((els) =>
    els.map((el) => (el as HTMLAnchorElement).href)
  );
  if (mailtos.length) {
    console.log('\nmailto-Links:');
    for (const m of mailtos) {
      console.log(' -', m, '→', parseMailto(m));
    }
  }

  const fields = await page.locator('input, textarea, select').evaluateAll((els) =>
    els.map((el) => {
      const e = el as HTMLInputElement;
      return {
        tag: e.tagName.toLowerCase(),
        type: e.type || '',
        name: e.name || '',
        id: e.id || '',
        placeholder: e.placeholder || '',
        label:
          (e.labels && e.labels[0] && e.labels[0].textContent?.trim()) ||
          e.getAttribute('aria-label') ||
          '',
      };
    })
  );

  console.log(`\nFelder (${fields.length}):`);
  for (const f of fields) {
    console.log(
      ` - <${f.tag} type="${f.type}" name="${f.name}" id="${f.id}"> label="${f.label}" placeholder="${f.placeholder}"`
    );
  }

  const buttons = await page.getByRole('button').evaluateAll((els) =>
    els.map((el) => el.textContent?.trim()).filter(Boolean)
  );
  const links = await page
    .getByRole('link', { name: /bewerben|apply|absenden/i })
    .evaluateAll((els) =>
      els.map((el) => ({
        text: el.textContent?.trim(),
        href: (el as HTMLAnchorElement).href,
      }))
    );

  console.log('\nButtons:', buttons.slice(0, 20));
  console.log('Bewerbungs-Links:', links);

  const shot = `artifacts/inspect-${Date.now()}.png`;
  await page.screenshot({ path: shot, fullPage: true });
  console.log('\nScreenshot:', shot);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
