module.exports = {
  env: {
    test: {
      plugins: [
        [
          'module-resolver',
          {
            root:  ['.'],
            alias: {
              '@': '.',
              '~': '.',
            },
          },
        ],
      ],
      presets: ['@babel/preset-env'],
    },
  },
};
