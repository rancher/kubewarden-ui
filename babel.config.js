module.exports = {
  env: {
    test: {
      plugins: [
        [
          'module-resolver',
          {
            root:  ['.'],
            alias: {
              '@':           '.',
              '~':           '.',
              '@kubewarden': './pkg/kubewarden',
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
