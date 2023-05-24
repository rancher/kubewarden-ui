import { test as base } from '@playwright/test';
import { RancherUI } from './pages/rancher-ui';

export type TestOptions = {
  ui: RancherUI;
};

export const test = base.extend<TestOptions>({
  ui: async ({ page }, use) => {
    use(new RancherUI(page));
  }
});

export { expect } from '@playwright/test';