const webpack = require('webpack');
const baseConfig = require('./.shell/pkg/vue.config')(__dirname);

module.exports = {
  ...baseConfig,
  chainWebpack: (config) => {
    if (typeof baseConfig.chainWebpack === 'function') {
      baseConfig.chainWebpack(config);
    }

    config.plugin('ignore-tests')
      .use(webpack.IgnorePlugin, [{ resourceRegExp: /[\\/]__tests__[\\/]/ }]);
  },
  configureWebpack: baseConfig.configureWebpack,
};
