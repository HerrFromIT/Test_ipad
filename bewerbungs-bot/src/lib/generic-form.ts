import type { Page } from '@playwright/test';
import type { ApplicationBundle, FormSelectorMap } from './types.js';

const FIELD_ALIASES: Record<string, RegExp[]> = {
  firstName: [/vorname/i, /first.?name/i, /given.?name/i],
  lastName: [/nachname/i, /last.?name/i, /family.?name/i, /surname/i],
  email: [/e-?mail/i],
  phone: [/telefon/i, /phone/i, /handy/i, /mobil/i],
  message: [/anschreiben/i, /motivation/i, /nachricht/i, /cover.?letter/i, /message/i],
};

/**
 * Füllt ein generisches Bewerbungsformular anhand von Selektoren oder Heuristiken.
 * Für Arbeitgeber-Seiten, auf die php-entwickler.de weiterleitet.
 */
export async function fillGenericForm(
  page: Page,
  bundle: ApplicationBundle,
  selectors?: FormSelectorMap
): Promise<void> {
  const { personal } = bundle.profile;
  const values: Record<string, string> = {
    firstName: personal.firstName,
    lastName: personal.lastName,
    email: personal.email,
    phone: personal.phone,
    message: bundle.meta.answers?.motivation ?? '',
  };

  for (const [field, value] of Object.entries(values)) {
    if (!value) continue;

    const customSelector = selectors?.[field as keyof FormSelectorMap];
    if (customSelector) {
      await fillBySelector(page, customSelector, value);
      continue;
    }

    await fillByHeuristic(page, field, value);
  }

  const cvSelector = selectors?.cvUpload;
  if (cvSelector) {
    await page.locator(cvSelector).setInputFiles(bundle.filePaths.cv);
  } else {
    await uploadByHeuristic(page, bundle.filePaths.cv, [/lebenslauf/i, /cv/i, /resume/i]);
  }

  if (bundle.filePaths.coverLetter) {
    const clSelector = selectors?.coverLetterUpload;
    if (clSelector) {
      await page.locator(clSelector).setInputFiles(bundle.filePaths.coverLetter);
    } else {
      await uploadByHeuristic(page, bundle.filePaths.coverLetter, [
        /anschreiben/i,
        /cover/i,
        /letter/i,
      ]);
    }
  }
}

export async function submitForm(page: Page, selectors?: FormSelectorMap): Promise<void> {
  if (selectors?.submit) {
    await page.locator(selectors.submit).click();
    return;
  }

  const submit = page.getByRole('button', {
    name: /bewerbung absenden|jetzt bewerben|absenden|senden|submit|apply/i,
  });
  await submit.first().click();
}

async function fillBySelector(page: Page, selector: string, value: string): Promise<void> {
  const loc = page.locator(selector);
  const tag = await loc.evaluate((el) => el.tagName.toLowerCase()).catch(() => 'input');

  if (tag === 'select') {
    await loc.selectOption({ label: value }).catch(() => loc.selectOption(value));
  } else {
    await loc.fill(value);
  }
}

async function fillByHeuristic(page: Page, field: string, value: string): Promise<void> {
  const patterns = FIELD_ALIASES[field] ?? [];
  for (const pattern of patterns) {
    const byLabel = page.getByLabel(pattern);
    if (await byLabel.count()) {
      await byLabel.first().fill(value);
      return;
    }
    const byPlaceholder = page.getByPlaceholder(pattern);
    if (await byPlaceholder.count()) {
      await byPlaceholder.first().fill(value);
      return;
    }
    const byName = page.locator(`input[name*="${field}" i], textarea[name*="${field}" i]`);
    if (await byName.count()) {
      await byName.first().fill(value);
      return;
    }
  }
}

async function uploadByHeuristic(
  page: Page,
  filePath: string,
  labelPatterns: RegExp[]
): Promise<void> {
  for (const pattern of labelPatterns) {
    const inputNearLabel = page.getByLabel(pattern).locator('input[type="file"]');
    if (await inputNearLabel.count()) {
      await inputNearLabel.first().setInputFiles(filePath);
      return;
    }
  }

  const fileInputs = page.locator('input[type="file"]');
  const count = await fileInputs.count();
  if (count === 1) {
    await fileInputs.first().setInputFiles(filePath);
  }
}
