import type { Page } from '@playwright/test';
import { BasePage } from './basepage';

export class AdmissionPoliciesPage extends BasePage {

  constructor(page: Page) {
    super(page, '/dashboard/c/local/kubewarden/policies.kubewarden.io.admissionpolicy');
  }

}
