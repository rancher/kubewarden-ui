const path = require('path');
const webpack = require('webpack');
const vendorConfigFactory = require('./.shell/pkg/vue.config');

module.exports = () => {
  const vendorConfig =
    typeof vendorConfigFactory === 'function' ? vendorConfigFactory(__dirname) : vendorConfigFactory;

  // Wrap the vendor configureWebpack if it exists.
  const vendorConfigureWebpack = vendorConfig.configureWebpack;
  const customConfigureWebpack = (config) => {
    if (typeof vendorConfigureWebpack === 'function') {
      vendorConfigureWebpack(config);
    }
    // Add the @sbomscanner alias to point to the pkg/sbomscanner directory.
    config.resolve.alias['@sbomscanner'] = path.resolve(__dirname);
  };

  // Create an override for __tests__ directories.
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

  // Merge our custom chainWebpack and configureWebpack with the vendor config.
  return Object.assign({}, vendorConfig, {
    chainWebpack:     mergedChainWebpack,
    configureWebpack: customConfigureWebpack,
  });
};
