import { test as baseTest, Locator } from '@playwright/test';
import { expect as baseExpect } from '@playwright/test';
import { RancherUI } from './components/rancher-ui';
import { Navigation } from './components/navigation';
import { Shell } from './components/kubectl-shell';
import { isString } from 'lodash';

export function step(target: Function, context: ClassMethodDecoratorContext) {
  return function replacementMethod(...args: any) {
      let name = this.constructor.name + '.' + (context.name as string)
      // Log object if it overrides toString method
      if (this.toString !== Object.prototype.toString) name += ': ' + this
      // Log function parameters and remove []
      if (isString(args[0])) name += ': ' + args[0] // JSON.stringify(args).slice(1, -1)
      if (args[0]?.name) name += ': ' + args[0].name
      return test.step(name, async () => {
          return await target.call(this, ...args);
      });
  };
}

export type TestOptions = {
  ui: RancherUI
  nav: Navigation
  shell: Shell
};

export const test = baseTest.extend<TestOptions>({
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

export const expect = baseExpect.extend({

  async toBeAllEnabled(locator: Locator, options?: { enabled?: boolean }) {
    const assertionName = 'toBeAllEnabled';
    let pass: boolean;
    const expected = options?.enabled == true ? 'enabled' : 'disabled';
    let matcherResult: any;
    try {
      await locator.locator('input,button').first().waitFor({state: 'attached'})
      await test.step(assertionName, async () => {
        for (const e of await locator.locator('input,button').all()) {
          await baseExpect(e).toBeEnabled(options)
        }
      })
      pass = true;
    } catch (e: any) {
      matcherResult = e.matcherResult;
      pass = false;
    }

    const message = pass
      ? () => this.utils.matcherHint(assertionName, undefined, undefined) +
        '\n\n' +
        `Locator: ${locator}\n` +
        `Expected: ${this.utils.printExpected(expected)}\n` +
        (matcherResult ? `Received: ${this.utils.printReceived(matcherResult.actual)}` : '')
      : () => this.utils.matcherHint(assertionName, undefined, undefined) +
        '\n\n' +
        `Locator: ${locator}\n` +
        `Expected: ${this.utils.printExpected(expected)}\n` +
        (matcherResult ? `Received: ${this.utils.printReceived(matcherResult.actual)}` : '');

    return {
      message,
      pass,
      name: assertionName,
      expected,
      actual: matcherResult?.actual,
    };
  },

});
