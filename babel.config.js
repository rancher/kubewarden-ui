module.exports = {
  env: {
    test: {
      plugins: [
        [
          'module-resolver',
          {
            root:  ['.'],
            alias: {
              '@':            '.',
              '~':            '.',
              '@kubewarden':  './pkg/kubewarden',
              '@sbomscanner': './pkg/sbomscanner',
            },
          },
        ],
      ],
      presets: [
        '@babel/preset-env',
        '@babel/preset-typescript'
      ],
    },
  },
};
