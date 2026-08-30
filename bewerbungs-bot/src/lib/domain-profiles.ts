import type { FormSelectorMap } from './types.js';

export type ApplyChannel = 'form' | 'mailto' | 'unknown';

export interface DomainProfile {
  /** Hostname-Match (Substring), z.B. "karriere.vema-eg.de" oder "jobs.personio.de" */
  hostIncludes: string;
  channel: ApplyChannel;
  mailto?: string;
  formSelectors?: FormSelectorMap;
  notes?: string;
}

/**
 * Bekannte Domain-Profile. Bei neuen Arbeitgeber-Seiten hier ergänzen,
 * nachdem du die Felder einmal mit `npm run inspect -- <url>` erfasst hast.
 */
export const DOMAIN_PROFILES: DomainProfile[] = [
  {
    hostIncludes: 'karriere.vema-eg.de',
    channel: 'mailto',
    mailto: 'bewerbung@vema-eg.de',
    notes:
      'Kein Webformular — Bewerbung per E-Mail an bewerbung@vema-eg.de (Betreff vorbefüllt).',
  },
  // Häufige ATS — Selektoren als Startpunkt, ggf. nachinspect anpassen
  {
    hostIncludes: 'jobs.personio.de',
    channel: 'form',
    formSelectors: {
      firstName: 'input[name="first_name"], input[name="firstname"]',
      lastName: 'input[name="last_name"], input[name="lastname"]',
      email: 'input[name="email"]',
      phone: 'input[name="phone"]',
      message: 'textarea[name="message"], textarea[name="cover_letter"]',
      cvUpload: 'input[type="file"][name*="cv" i], input[type="file"]',
      submit: 'button[type="submit"]',
    },
    notes: 'Personio ATS — Felder können je nach Stellenkonfiguration variieren.',
  },
  {
    hostIncludes: 'softgarden.io',
    channel: 'form',
    formSelectors: {
      firstName: 'input[name*="firstName" i], input[id*="firstName" i]',
      lastName: 'input[name*="lastName" i], input[id*="lastName" i]',
      email: 'input[type="email"]',
      phone: 'input[type="tel"], input[name*="phone" i]',
      message: 'textarea',
      cvUpload: 'input[type="file"]',
      submit: 'button[type="submit"]',
    },
  },
  {
    hostIncludes: 'join.com',
    channel: 'form',
    formSelectors: {
      firstName: 'input[name="firstName"]',
      lastName: 'input[name="lastName"]',
      email: 'input[name="email"]',
      phone: 'input[name="phone"]',
      message: 'textarea[name="coverLetter"], textarea',
      cvUpload: 'input[type="file"]',
      submit: 'button[type="submit"]',
    },
  },
];

export function resolveDomainProfile(url: string): DomainProfile | undefined {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return DOMAIN_PROFILES.find((p) => host.includes(p.hostIncludes));
  } catch {
    return undefined;
  }
}

export function parseMailto(href: string): { email: string; subject?: string } | null {
  if (!href.toLowerCase().startsWith('mailto:')) return null;
  const withoutScheme = href.slice('mailto:'.length);
  const [emailPart, query = ''] = withoutScheme.split('?');
  const email = decodeURIComponent(emailPart).trim();
  const params = new URLSearchParams(query);
  const subject = params.get('subject') ?? undefined;
  return { email, subject };
}
