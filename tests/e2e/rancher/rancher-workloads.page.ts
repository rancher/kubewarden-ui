import { step } from './rancher-test'
import { BasePage } from './basepage'

export interface Deployment {
  name      : string
  image     : string
  namespace?: string
  labels?   : Record<string, string>
}

export class RancherWorkloadsPage extends BasePage {
  async goto(): Promise<void> {
    await this.nav.explorer('Workloads', 'Deployments')
  }

  @step
  async addDeployment(dep: Deployment) {
    await this.goto()
    await this.ui.button('Create').click()

    await this.ui.input('Name *').fill(dep.name)
    await this.ui.input('Container Image').fill(dep.image)
    if (dep.namespace) {
      await this.ui.selectOption('Namespace *', /^Create a [nN]ew Namespace$/)
      await this.ui.input('Namespace *').fill(dep.namespace)
    }
    if (dep.labels) {
      await this.ui.tab('Deployment').click()
      const l = this.page.locator('div.labels')
      for (const [i, [key, value]] of Object.entries(dep.labels).entries()) {
        await this.ui.button('Add Label').click()
        await l.getByLabel(`Key for row ${i + 1}`).fill(key)
        await l.getByLabel(`Value for row ${i + 1}`).fill(value)
      }
      // Give generated fields time to get registered
      await this.page.waitForTimeout(1000)
    }
    await this.ui.button('Create').click()
    await this.ui.tableRow(dep.name).toBeActive()
  }

  @step
  async deleteDeployment(name: string) {
    await this.nav.explorer('Workloads', 'Deployments')
    await this.ui.tableRow(name).delete()
  }
}
