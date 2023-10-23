import type { Page } from '@playwright/test';
import { RancherUI } from './rancher-ui'
import { Navigation } from '../components/navigation'

export abstract class BasePage {
    protected readonly ui: RancherUI;
    protected readonly nav: Navigation;

    constructor(public readonly page: Page) {
        this.ui = new RancherUI(page)
        this.nav = new Navigation(this.ui)
    }

    abstract goto(): Promise<void>

}