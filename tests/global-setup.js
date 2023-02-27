// global-setup.js
const { request } = require('@playwright/test');

module.exports = async() => {
  const requestContext = await request.newContext({
    ignoreHTTPSErrors: true,
    baseURL:           process.env.RANCHER_URL, // "https://example.com"
  });

  await requestContext.post('/v3-public/localProviders/local?action=login', {
    data: {
      username:     'admin',
      password:     'sa',
      responseType: 'cookie',
    },
  });

  // Save signed-in state to 'storageState.json'.
  await requestContext.storageState({ path: 'storageState.json' });
  await requestContext.dispose();
};
