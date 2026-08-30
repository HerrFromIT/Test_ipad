export type Portal = 'php_entwickler' | 'get_in_it' | 'external';

export interface ProfileData {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    zip: string;
    city: string;
    country: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  defaults: Record<string, string | number | boolean>;
  skills: string[];
  portals: Record<
    string,
    {
      email: string;
      passwordEnv: string;
    }
  >;
}

export interface ApplicationFiles {
  cv: string;
  coverLetter?: string;
  certificates?: string[];
}

export interface ApplicationMeta {
  id: string;
  portal: Portal;
  jobUrl?: string;
  applyUrl?: string;
  company?: string;
  position?: string;
  action?: 'apply' | 'update_profile';
  status: 'pending' | 'processing' | 'done' | 'failed';
  files: ApplicationFiles;
  answers?: Record<string, string>;
  formSelectors?: FormSelectorMap;
  notes?: string;
  profile?: Record<string, unknown>;
}

/** Pro Domain: welche Selektoren welche Felder bedeuten */
export interface FormSelectorMap {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
  cvUpload?: string;
  coverLetterUpload?: string;
  submit?: string;
}

export interface ApplicationBundle {
  folderPath: string;
  meta: ApplicationMeta;
  profile: ProfileData;
  filePaths: {
    cv: string;
    coverLetter?: string;
    certificates: string[];
  };
}

export interface ApplyResult {
  success: boolean;
  message: string;
  screenshotPath?: string;
  finalUrl?: string;
}
