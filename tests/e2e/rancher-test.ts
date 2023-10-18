import { test as base } from '@playwright/test';
import { RancherUI } from './pages/rancher-ui';
import { Navigation } from './components/navigation';

export type TestOptions = {
  ui: RancherUI
  nav: Navigation
};

export const test = base.extend<TestOptions>({
  ui: async ({ page }, use) => {
    use(new RancherUI(page));
  },
  nav: async ({ page }, use) => {
    use(new Navigation(page));
  },
});

export { expect } from '@playwright/test';