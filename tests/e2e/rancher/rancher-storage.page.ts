import { step } from './rancher-test'
import { BasePage } from './basepage'
import { Shell } from '../components/kubectl-shell'

export interface Secret {
  type      : 'Registry' | 'HTTP Basic Auth'
  namespace?: string
  name      : string
  username  : string
  password  : string
  domain?   : string
}

export class RancherStoragePage extends BasePage {
  async goto(): Promise<void> {
    await this.nav.explorer('Storage', 'Secrets')
  }

  // async?
  // Create secrets in nodejs shell to not log creadentials
  async createSecretInShell(secret: Secret) {
    const shell = new Shell(this.page)
    shell.runExec(`kubectl get ns ${secret.namespace} || kubectl create ns ${secret.namespace}`)

    switch (secret.type) {
      case 'HTTP Basic Auth':
        shell.runExec(`kubectl create secret generic ${secret.name} -n ${secret.namespace} \
            --type=kubernetes.io/basic-auth \
            --from-literal=username=${secret.username} \
            --from-literal=password=${secret.password}`)
        break
      case 'Registry':
        shell.runExec(`kubectl create secret docker-registry ${secret.name} -n ${secret.namespace} \
            --docker-server=${secret.domain} \
            --docker-username=${secret.username} \
            --docker-password=${secret.password}`)
        break
      default:
        throw new Error(`Unsupported secret type: ${secret.type}`)
    }
  }

  @step
  async createSecret(sec: Secret) {
    await this.goto()
    await this.ui.button('Create').click()
    await this.page.locator('div.subtype-banner').getByRole('heading', { name: sec.type }).click()

    if (sec.namespace) {
      await this.ui.selectOption('Namespace *', /^Create a [nN]ew Namespace$/)
      await this.ui.input('Namespace *').fill(sec.namespace)
    }
    await this.ui.input('Name *').fill(sec.name)
    await this.ui.input('Username *').fill(sec.username)
    await this.ui.input('Password *').fill(sec.password)

    if (sec.domain) {
      await this.ui.input('Registry Domain Name *').fill(sec.domain)
    }

    await this.ui.button('Create').click()
    await this.ui.tableRow(sec.name).toBeActive()
  }

  @step
  async deleteSecret(name: string) {
    await this.nav.explorer('Storage', 'Secrets')
    await this.ui.tableRow(name).delete()
  }
}
