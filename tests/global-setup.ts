import type { FullConfig } from '@playwright/test'
import { request } from '@playwright/test'

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
  await requestContext.dispose()
}

export default globalSetup
