#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  APPLICATIONS_DIR,
  listPendingApplications,
  loadApplication,
  moveApplication,
  saveResult,
} from './lib/load-application.js';
import { applyViaPhpEntwickler } from './portals/php-entwickler.js';
import { updateGetInItProfile } from './portals/get-in-it.js';

function parseArgs(argv: string[]) {
  const dryRun = argv.includes('--dry-run');
  const folderIdx = argv.indexOf('--folder');
  const folder =
    folderIdx >= 0 && argv[folderIdx + 1]
      ? path.resolve(argv[folderIdx + 1])
      : undefined;
  const headless = !argv.includes('--headed');
  return { dryRun, folder, headless };
}

async function processOne(folderPath: string, dryRun: boolean, headless: boolean) {
  const bundle = await loadApplication(folderPath);
  console.log(`\n→ ${bundle.meta.id} (${bundle.meta.portal})`);

  if (!dryRun) {
    await moveApplication(folderPath, 'processing');
    folderPath = path.join(APPLICATIONS_DIR, '..', 'processing', path.basename(folderPath));
  }

  let result;
  switch (bundle.meta.portal) {
    case 'php_entwickler':
      result = await applyViaPhpEntwickler(bundle, { dryRun, headless });
      break;
    case 'get_in_it':
      result = await updateGetInItProfile(bundle, { dryRun, headless });
      break;
    default:
      result = {
        success: false,
        message: `Unbekanntes Portal: ${bundle.meta.portal}`,
      };
  }

  console.log(result.success ? '✓' : '✗', result.message);
  if (result.finalUrl) console.log('  URL:', result.finalUrl);
  if (result.screenshotPath) console.log('  Screenshot:', result.screenshotPath);
  if (result.emailDraft) {
    console.log('  E-Mail-Entwurf →', result.emailDraft.to);
    console.log('  Betreff:', result.emailDraft.subject);
  }

  if (!dryRun) {
    await saveResult(folderPath, result);
    await moveApplication(folderPath, result.success ? 'done' : 'failed');
  }

  return result;
}

async function main() {
  const { dryRun, folder, headless } = parseArgs(process.argv.slice(2));
  await mkdir('artifacts', { recursive: true });

  const folders = folder ? [folder] : await listPendingApplications();

  if (!folders.length) {
    console.log('Keine Bewerbungen in data/applications/ (Ordner ohne _-Prefix).');
    console.log('Lege einen Ordner an, z.B.: data/applications/firma-stelle/');
    process.exit(0);
  }

  console.log(`${folders.length} Bewerbung(en) gefunden${dryRun ? ' [DRY-RUN]' : ''}`);

  let ok = 0;
  let fail = 0;
  for (const f of folders) {
    const result = await processOne(f, dryRun, headless);
    result.success ? ok++ : fail++;
  }

  console.log(`\nFertig: ${ok} erfolgreich, ${fail} fehlgeschlagen`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
