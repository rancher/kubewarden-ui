import { test as base } from '@playwright/test';
import { RancherUI } from './components/rancher-ui';
import { Navigation } from './components/navigation';
import { Shell } from './components/kubectl-shell';

export type TestOptions = {
  ui: RancherUI
  nav: Navigation
  shell: Shell
};

export const test = base.extend<TestOptions>({
  ui: async ({ page }, use) => {
    use(new RancherUI(page));
  },
  nav: async ({ ui }, use) => {
    use(new Navigation(ui));
  },
  shell: async ({ page }, use) => {
    use(new Shell(page));
  },
});

export { expect } from '@playwright/test';