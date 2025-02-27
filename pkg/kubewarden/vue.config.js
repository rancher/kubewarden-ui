const webpack = require('webpack');
const vendorConfigFactory = require('./.shell/pkg/vue.config');

module.exports = () => {
  const vendorConfig = typeof vendorConfigFactory === 'function' ? vendorConfigFactory(__dirname) : vendorConfigFactory;

  // Create an override for __tests__ directories
  const kwChainWebpack = (config) => {
    config.plugin('ignore-tests')
      .use(webpack.IgnorePlugin, [{ resourceRegExp: /[\\/]__tests__[\\/]/ }]);
  };

  const mergedChainWebpack = (config) => {
    if (typeof vendorConfig.chainWebpack === 'function') {
      vendorConfig.chainWebpack(config);
    }

    kwChainWebpack(config);
  };

  // Merge kw config with the vendor config.
  return Object.assign({}, vendorConfig, { chainWebpack: mergedChainWebpack });
};
