import { readFile, readdir, rename, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ApplicationBundle, ApplicationMeta, ProfileData } from './types.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
export const DATA_DIR = path.join(ROOT, 'data');
export const APPLICATIONS_DIR = path.join(DATA_DIR, 'applications');
export const PROFILE_PATH = path.join(DATA_DIR, 'profile.json');

export async function loadProfile(): Promise<ProfileData> {
  const raw = await readFile(PROFILE_PATH, 'utf8');
  return JSON.parse(raw) as ProfileData;
}

export async function listPendingApplications(): Promise<string[]> {
  const entries = await readdir(APPLICATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => path.join(APPLICATIONS_DIR, e.name));
}

export async function loadApplication(folderPath: string): Promise<ApplicationBundle> {
  const metaPath = path.join(folderPath, 'meta.json');
  const raw = await readFile(metaPath, 'utf8');
  const meta = JSON.parse(raw) as ApplicationMeta;
  const profile = await loadProfile();

  const cv = path.join(folderPath, meta.files.cv);
  const coverLetter = meta.files.coverLetter
    ? path.join(folderPath, meta.files.coverLetter)
    : undefined;
  const certificates = (meta.files.certificates ?? []).map((f) => path.join(folderPath, f));

  return {
    folderPath,
    meta,
    profile,
    filePaths: { cv, coverLetter, certificates },
  };
}

export async function moveApplication(
  folderPath: string,
  target: 'processing' | 'done' | 'failed'
): Promise<void> {
  const baseName = path.basename(folderPath);
  const targetRoot = path.join(APPLICATIONS_DIR, '..', target);
  await mkdir(targetRoot, { recursive: true });
  const targetPath = path.join(targetRoot, baseName);
  await rename(folderPath, targetPath);
}

export async function saveResult(
  folderPath: string,
  result: { success: boolean; message: string; finalUrl?: string }
): Promise<void> {
  const resultPath = path.join(folderPath, 'result.json');
  await writeFile(
    resultPath,
    JSON.stringify({ ...result, finishedAt: new Date().toISOString() }, null, 2),
    'utf8'
  );
}

export function getPortalPassword(profile: ProfileData, portal: string): string {
  const config = profile.portals[portal];
  if (!config) throw new Error(`Kein Portal-Login in profile.json für: ${portal}`);
  const password = process.env[config.passwordEnv];
  if (!password) {
    throw new Error(
      `Passwort fehlt. Setze Umgebungsvariable ${config.passwordEnv}`
    );
  }
  return password;
}
