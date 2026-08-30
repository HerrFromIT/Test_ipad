import { chromium, type Page } from '@playwright/test';
import type { ApplicationBundle, ApplyResult } from '../lib/types.js';
import { fillGenericForm, submitForm } from '../lib/generic-form.js';
import { getPortalPassword } from '../lib/load-application.js';
import {
  parseMailto,
  resolveDomainProfile,
  type DomainProfile,
} from '../lib/domain-profiles.js';

const LOGIN_URL = 'https://www.php-entwickler.de/login';

/**
 * php-entwickler.de hat zwei Bewerbungswege (seit 2026):
 * 1. Partner-Firma → Bewerbung bleibt auf php-entwickler.de (Ein-Klick mit Profil)
 * 2. Alle anderen → Weiterleitung auf Karriereseite des Arbeitgebers
 *
 * Konkretes Beispiel (VEMA): Job 162463 → karriere.vema-eg.de → mailto, kein Formular.
 */
export async function applyViaPhpEntwickler(
  bundle: ApplicationBundle,
  options: { dryRun?: boolean; headless?: boolean; forcePortal?: boolean } = {}
): Promise<ApplyResult> {
  // Shortcut: applyUrl direkt (ohne Portal-Login), z.B. aus meta.json
  if (bundle.meta.applyUrl && !options.forcePortal) {
    return applyDirectExternal(bundle, bundle.meta.applyUrl, options);
  }

  const jobUrl = bundle.meta.jobUrl;
  if (!jobUrl) {
    return { success: false, message: 'meta.json braucht jobUrl oder applyUrl' };
  }

  const browser = await chromium.launch({ headless: options.headless ?? true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await login(page, bundle);

    await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const applyButton = page.getByRole('link', { name: /bewerben/i }).or(
      page.getByRole('button', { name: /bewerben/i })
    );

    if (!(await applyButton.count())) {
      return {
        success: false,
        message: 'Kein Bewerben-Button gefunden. Selektoren evtl. anpassen.',
        finalUrl: page.url(),
      };
    }

    // mailto direkt vom Portal-Button?
    const href = await applyButton.first().getAttribute('href');
    if (href?.toLowerCase().startsWith('mailto:')) {
      return handleMailto(bundle, href, page.url(), options.dryRun);
    }

    const [maybeNewPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 8000 }).catch(() => null),
      applyButton.first().click(),
    ]);

    const targetPage = maybeNewPage ?? page;
    await targetPage.waitForLoadState('domcontentloaded');
    await targetPage.waitForTimeout(2000);

    const onPhpEntwickler = targetPage.url().includes('php-entwickler.de');

    if (onPhpEntwickler) {
      return await applyOnPortal(targetPage, bundle, options.dryRun);
    }

    return await applyOnExternalSite(targetPage, bundle, options.dryRun);
  } catch (error) {
    const screenshotPath = `artifacts/php-entwickler-${bundle.meta.id}-error.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      screenshotPath,
      finalUrl: page.url(),
    };
  } finally {
    await browser.close();
  }
}

async function applyDirectExternal(
  bundle: ApplicationBundle,
  applyUrl: string,
  options: { dryRun?: boolean; headless?: boolean }
): Promise<ApplyResult> {
  const browser = await chromium.launch({ headless: options.headless ?? true });
  const page = await browser.newPage();
  try {
    await page.goto(applyUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    return await applyOnExternalSite(page, bundle, options.dryRun);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      finalUrl: applyUrl,
    };
  } finally {
    await browser.close();
  }
}

async function login(page: Page, bundle: ApplicationBundle): Promise<void> {
  const portal = bundle.profile.portals.php_entwickler;
  const password = getPortalPassword(bundle.profile, 'php_entwickler');

  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

  await page.getByLabel(/e-?mail/i).fill(portal.email);
  await page.getByLabel(/passwort/i).fill(password);
  await page.getByRole('button', { name: /anmelden|login|einloggen/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 15_000 });
}

async function applyOnPortal(
  page: Page,
  bundle: ApplicationBundle,
  dryRun?: boolean
): Promise<ApplyResult> {
  const oneClick = page.getByRole('button', {
    name: /jetzt bewerben|bewerbung senden|ein-klick/i,
  });

  if (await oneClick.count()) {
    if (dryRun) {
      return {
        success: true,
        message: '[DRY-RUN] Ein-Klick-Bewerbung auf php-entwickler.de würde abgesendet',
        finalUrl: page.url(),
      };
    }
    await oneClick.first().click();
    await page.waitForTimeout(3000);
    return {
      success: true,
      message: 'Ein-Klick-Bewerbung auf php-entwickler.de abgesendet',
      finalUrl: page.url(),
    };
  }

  await fillGenericForm(page, bundle, bundle.meta.formSelectors);
  if (dryRun) {
    return {
      success: true,
      message: '[DRY-RUN] Formular auf php-entwickler.de wäre ausgefüllt',
      finalUrl: page.url(),
    };
  }
  await submitForm(page, bundle.meta.formSelectors);
  await page.waitForTimeout(3000);
  return {
    success: true,
    message: 'Formular auf php-entwickler.de ausgefüllt und abgesendet',
    finalUrl: page.url(),
  };
}

async function applyOnExternalSite(
  page: Page,
  bundle: ApplicationBundle,
  dryRun?: boolean
): Promise<ApplyResult> {
  const externalUrl = page.url();
  const domain = resolveDomainProfile(externalUrl);

  // 1) Bekanntes mailto-Profil (z.B. VEMA)
  if (domain?.channel === 'mailto') {
    const subject =
      bundle.meta.answers?.emailSubject ??
      `Bewerbung als ${bundle.meta.position ?? 'PHP Entwickler'}`;
    const href = `mailto:${domain.mailto}?subject=${encodeURIComponent(subject)}`;
    return handleMailto(bundle, href, externalUrl, dryRun, domain);
  }

  // 2) mailto-Link auf der Seite entdecken
  const mailtoHref = await page
    .locator('a[href^="mailto:"]')
    .first()
    .getAttribute('href')
    .catch(() => null);
  if (mailtoHref) {
    return handleMailto(bundle, mailtoHref, externalUrl, dryRun, domain);
  }

  // 3) Formular mit Domain-Selektoren oder Heuristik
  const selectors = bundle.meta.formSelectors ?? domain?.formSelectors;
  await fillGenericForm(page, bundle, selectors);

  if (dryRun) {
    return {
      success: true,
      message: `[DRY-RUN] Externes Formular wäre ausgefüllt: ${externalUrl}${
        domain ? ` (Profil: ${domain.hostIncludes})` : ''
      }`,
      finalUrl: externalUrl,
    };
  }

  await submitForm(page, selectors);
  await page.waitForTimeout(4000);

  return {
    success: true,
    message: `Externe Bewerbung abgesendet: ${externalUrl}`,
    finalUrl: page.url(),
  };
}

function handleMailto(
  bundle: ApplicationBundle,
  href: string,
  pageUrl: string,
  dryRun?: boolean,
  domain?: DomainProfile
): ApplyResult {
  const parsed = parseMailto(href);
  if (!parsed) {
    return { success: false, message: `Ungültiger mailto-Link: ${href}`, finalUrl: pageUrl };
  }

  const subject =
    parsed.subject ??
    bundle.meta.answers?.emailSubject ??
    `Bewerbung als ${bundle.meta.position ?? 'PHP Entwickler'}`;

  const body =
    bundle.meta.answers?.motivation ??
    `Sehr geehrte Damen und Herren,\n\nanbei meine Bewerbung als ${bundle.meta.position}.\n\nMit freundlichen Grüßen\n${bundle.profile.personal.firstName} ${bundle.profile.personal.lastName}`;

  const draft = {
    channel: 'mailto' as const,
    to: parsed.email,
    subject,
    body,
    attachments: [
      bundle.filePaths.cv,
      ...(bundle.filePaths.coverLetter ? [bundle.filePaths.coverLetter] : []),
      ...bundle.filePaths.certificates,
    ],
    sourceUrl: pageUrl,
    domainProfile: domain?.hostIncludes,
  };

  // result.json schreibt der Runner; hier als message serialisiert für Logging
  const prefix = dryRun ? '[DRY-RUN] ' : '';
  return {
    success: true,
    message: `${prefix}E-Mail-Entwurf vorbereitet an ${parsed.email} — Absenden via n8n/Gmail oder manuell`,
    finalUrl: pageUrl,
    emailDraft: draft,
  };
}
