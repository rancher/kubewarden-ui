import type { Page } from '@playwright/test';
import { RancherUI } from './rancher-ui'

export abstract class BasePage {
    protected readonly ui: RancherUI;

    constructor(public readonly page: Page, readonly url?: string) {
        this.ui = new RancherUI(page)
    }

    async goto() {
        if(this.url === undefined) {
            throw new Error("URL is undefined");
        } else {
            await this.page.goto(this.url);
        }
    }

}