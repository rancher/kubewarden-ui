import { expect } from '@playwright/test'
import { RancherAppsPage, Repo } from '../rancher/rancher-apps.page'
import { BasePage } from '../rancher/basepage'
import { step } from '../rancher/rancher-test'
import { RancherStoragePage } from '../rancher/rancher-storage.page'
import { Common } from '../components/common'
import { Shell } from '../components/kubectl-shell'
import { RancherUI, YAMLPatch } from '../components/rancher-ui'

// Generated Pull secret has the same name as auth
export const secretName = 'appco-auth-runenforcer'

const reRepo: Repo = { name: 'suse-security-runtime-enforcer', url: 'oci://registry.suse.de/devel/jasmine/charts/charts/suse-security-runtime-enforcer', skipTLS: true }

export class RuntimeEnforcerPage extends BasePage {
  async goto(): Promise<void> {
    await this.nav.runEnforcer()
    // Ignore welcome screen skipping
    await this.page.waitForTimeout(2000)
  }

  // Inject all registry.suse.de repositories
  @step
  async installFromV0(from: 'github'|'gitlab'|'prime', options?: { version?: string }) {
    const appsPage = new RancherAppsPage(this.page)
    const cmRepo: Repo = { name: 'cert-manager', url: 'oci://registry.suse.de/devel/orchid/charts/charts/cert-manager', skipTLS: true }
    const csiRepo: Repo = { name: 'cert-manager-csi-driver', url: 'oci://registry.suse.de/devel/orchid/charts/charts/cert-manager-csi-driver', skipTLS: true }

    let csiPatch: YAMLPatch | undefined
    let rePatch: YAMLPatch | undefined
    if (from == 'gitlab') {
      const gl = Common.findGitLabRefs('Runtime Enforcer')

      csiPatch = (y) => {
        for (const node of [y.image, y.livenessProbeImage, y.nodeDriverRegistrarImage]) {
          node.registry = 'registry.suse.de/devel/orchid/containers'
          node.tag = node.tag.replace(/-.*/, '')
        }
      }
      rePatch = (y) => {
        for (const node of [y.controller, y.agent, y.debugger]) {
          node.image.registry = gl.reg
          node.image.tag = node.image.tag.replace(/-.*/, '')
        }
        y.telemetry.defaultCollector.image.registry = 'registry.suse.de/devel/orchid/containers'
        y.telemetry.defaultCollector.image.tag = '0-contrib'
      }

      // Add & annotate repository
      await appsPage.addRepository({ ...reRepo, url: gl.chart })
      await appsPage.addRepository(cmRepo, { skipExisting: true })
      await appsPage.addRepository(csiRepo)
      await new Shell(this.page).runBatch(
        // Annotation is protected and would be discarded by UI
        `kubectl annotate clusterrepos.catalog.cattle.io ${reRepo.name} catalog.cattle.io/suse-application-collection=true`,
        `kubectl annotate clusterrepos.catalog.cattle.io ${cmRepo.name} catalog.cattle.io/suse-application-collection=true`,
        `kubectl annotate clusterrepos.catalog.cattle.io ${csiRepo.name} catalog.cattle.io/suse-application-collection=true`
      )
      // Activate installer buttons
      await this.page.reload()
    }

    await this.goto()
    if (from == 'prime') {
      const authSec = new RancherStoragePage(this.page).createAppcoAuth(secretName)

      // Welcome screen - skipped if repos are available
      const startBtn = this.ui.button('Start Installation')
      await expect(startBtn.or(this.ui.select('Authentication'))).toBeVisible()
      if (await startBtn.isVisible()) await startBtn.click()

      // AppCo Registry Auth
      await this.ui.selectOption('Authentication', new RegExp(`^${authSec.name} `))
      await this.ui.button('Continue').click()
      // Add Repositories
      await this.ui.button('Add all repositories').or(this.ui.button('Action')).click() // 'Action' if sbomscanner UI is not installed

      // Chart secret UI is not available in Rancher < 2.14
      if (RancherUI.isVersion('<2.14')) {
        rePatch = csiPatch = (y) => {
          y.global.imagePullSecrets[0] = authSec.name
        }
      }
    }

    // Install Cert-Manager CSI Driver
    await this.ui.button('Install Cert-Manager CSI Driver').click()
    await appsPage.installChart(
      { title: '-', name: 'cert-manager-csi-driver', check: 'cert-manager-csi-driver' },
      { navigate: false, yamlPatch: csiPatch }
    )

    // Install Runtime Enforcer
    await this.goto()
    await this.ui.button('Install Runtime Enforcer').click()
    await appsPage.installChart(
      { title: '-', check: 'suse-security-runtime-enforcer', version: options?.version },
      { navigate: false, yamlPatch: rePatch }
    )
  }

  // Follow official steps but replace RE repository
  @step
  async installFrom(from: 'github'|'gitlab'|'prime', options?: { version?: string }) {
    const appsPage = new RancherAppsPage(this.page)
    const authSec = new RancherStoragePage(this.page).createAppcoAuth(secretName)

    await this.goto()
    // Welcome screen - skipped if repos are available
    const startBtn = this.ui.button('Start Installation')
    await expect(startBtn.or(this.ui.select('Authentication'))).toBeVisible()
    if (await startBtn.isVisible()) await startBtn.click()

    // AppCo Registry Auth
    await this.ui.selectOption('Authentication', new RegExp(`^${authSec.name} `))
    await this.ui.button('Continue').click()

    // Add Repositories ('Action' if sbomscanner UI is not installed)
    await this.ui.button('Add all repositories').or(this.ui.button('Action')).click()

    // Install Cert-Manager CSI Driver
    await this.ui.button('Install Cert-Manager CSI Driver').click()
    await appsPage.installChart(
      { title: '-', name: 'cert-manager-csi-driver', check: 'cert-manager-csi-driver' },
      { navigate: false })

    let rePatch: YAMLPatch | undefined
    if (from == 'gitlab') {
      const gl = Common.findGitLabRefs('Runtime Enforcer')

      rePatch = (y) => {
        for (const node of [y.controller, y.agent, y.debugger]) {
          node.image.registry = gl.reg // 'registry.suse.de/devel/jasmine/containers' or MR
          node.image.tag = node.image.tag.replace(/-.*/, '')
        }
        // Dependencies which are not part of MR, there are two options:
        y.global.imagePullSecrets[0] = secretName
        // y.telemetry.defaultCollector.image.registry = 'registry.suse.de/devel/orchid/containers'
        // y.telemetry.defaultCollector.image.tag = '0-contrib'
      }
      // Replace AppCo repository by GitLab (same name, different url)
      await appsPage.deleteRepository(reRepo)
      await appsPage.addRepository({ ...reRepo, url: gl.chart })
      await new Shell(this.page).run(`kubectl annotate clusterrepos.catalog.cattle.io ${reRepo.name} catalog.cattle.io/suse-application-collection=true`)

      // Activate installer buttons
      await this.page.reload()
    }

    // Install Runtime Enforcer
    await this.goto()
    await this.ui.button('Install Runtime Enforcer').click()
    await appsPage.installChart(
      { title: '-', check: 'suse-security-runtime-enforcer', version: options?.version },
      { navigate: false, yamlPatch: rePatch })
  }
}
