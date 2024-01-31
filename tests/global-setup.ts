import type { FullConfig } from '@playwright/test'
import { expect, request } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use

  const requestContext = await request.newContext({ baseURL, ignoreHTTPSErrors: true })
  await requestContext.post('/v3-public/localProviders/local?action=login', {
    data: {
      username    : 'admin',
      password    : 'sa',
      responseType: 'cookie',
    },
  })

  // Save signed-in state to 'storageState.json'.
  await requestContext.storageState({ path: storageState as string })

  // Get clusterId from displayName
  const clusterName = process.env.CLUSTER
  if (clusterName) {
    const req = await requestContext.get(`/v1/provisioning.cattle.io.clusters/fleet-default/${clusterName}`)
    expect(req.ok()).toBeTruthy()
    const reqJson = await req.json()
    process.env.CLUSTER_ID = reqJson.status.clusterName
  }

  await requestContext.dispose()
}

export default globalSetup
