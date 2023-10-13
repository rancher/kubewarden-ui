import type { Page } from '@playwright/test';
import { RancherUI } from './rancher-ui'
import { Navigation } from '../components/navigation'

export abstract class BasePage {
    protected readonly ui: RancherUI;
    protected readonly nav: Navigation;

    constructor(public readonly page: Page, readonly url?: string) {
        this.ui = new RancherUI(page)
        this.nav = new Navigation(page)
    }

    async goto() {
        if(this.url === undefined) {
            throw new Error("URL is undefined");
        } else {
            await this.page.goto(this.url);
        }
    }

}