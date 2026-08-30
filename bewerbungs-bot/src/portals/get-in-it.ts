import { chromium, type Page } from '@playwright/test';
import type { ApplicationBundle, ApplyResult } from '../lib/types.js';
import { getPortalPassword } from '../lib/load-application.js';

const REGISTER_URL = 'https://www.get-in-it.de/profil-anlegen';
const LOGIN_URL = 'https://www.get-in-it.de/login';

/**
 * get-in-it funktioniert anders als klassische Bewerbungsportale:
 * Du legst EINMAL ein Profil an, trägst Skills ein, lädst Lebenslauf hoch.
 * Arbeitgeber kontaktieren DICH — es gibt kein Formular pro Stelle.
 */
export async function updateGetInItProfile(
  bundle: ApplicationBundle,
  options: { dryRun?: boolean; headless?: boolean } = {}
): Promise<ApplyResult> {
  const browser = await chromium.launch({ headless: options.headless ?? true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await loginOrRegister(page, bundle);

    // Profil-Bereich — Selektoren müssen ggf. nach UI-Update angepasst werden
    await page.goto('https://www.get-in-it.de/meine-bewerbung', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(2000);

    const profile = bundle.meta.profile ?? {};
    const headline = String(profile.headline ?? '');

    if (headline) {
      const headlineField = page.getByLabel(/überschrift|headline|titel/i);
      if (await headlineField.count()) {
        await headlineField.first().fill(headline);
      }
    }

    // Lebenslauf hochladen
    const cvInput = page.locator('input[type="file"]');
    if (await cvInput.count()) {
      if (!options.dryRun) {
        await cvInput.first().setInputFiles(bundle.filePaths.cv);
      }
    }

    // Skills — get-in-it hat vordefinierte Skill-Auswahl
    const skills = (profile.skills as string[] | undefined) ?? bundle.profile.skills;
    for (const skill of skills.slice(0, 15)) {
      const skillChip = page.getByRole('button', { name: new RegExp(skill, 'i') });
      if (await skillChip.count()) {
        await skillChip.first().click().catch(() => {});
      }
    }

    const saveButton = page.getByRole('button', {
      name: /speichern|profil aktualisieren|weiter/i,
    });

    if (options.dryRun) {
      return {
        success: true,
        message: '[DRY-RUN] get-in-it Profil wäre aktualisiert',
        finalUrl: page.url(),
      };
    }

    if (await saveButton.count()) {
      await saveButton.first().click();
      await page.waitForTimeout(3000);
    }

    return {
      success: true,
      message: 'get-in-it Profil aktualisiert (kein Stellen-Bewerbungsformular)',
      finalUrl: page.url(),
    };
  } catch (error) {
    const screenshotPath = `artifacts/get-in-it-${bundle.meta.id}-error.png`;
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

async function loginOrRegister(page: Page, bundle: ApplicationBundle): Promise<void> {
  const portal = bundle.profile.portals.get_in_it;
  const password = getPortalPassword(bundle.profile, 'get_in_it');

  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

  const emailField = page.getByLabel(/e-?mail/i);
  if (await emailField.count()) {
    await emailField.fill(portal.email);
    await page.getByLabel(/passwort/i).fill(password);
    await page.getByRole('button', { name: /anmelden|login|einloggen/i }).click();

    const loggedIn = await page
      .waitForURL((url) => !url.pathname.includes('login'), { timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    if (loggedIn) return;
  }

  // Fallback: Registrierung (nur beim ersten Mal)
  await page.goto(REGISTER_URL, { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/e-?mail/i).fill(portal.email);
  await page.getByLabel(/passwort/i).fill(password);
  await page.getByRole('checkbox').first().check();
  await page.getByRole('button', { name: /registrieren/i }).click();
  await page.waitForTimeout(3000);
}
