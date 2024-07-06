const { override } = require('customize-cra');

module.exports = override((config) => {
  // Add custom webpack configuration
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-refresh/runtime': require.resolve('react-refresh/runtime')
  };
  return config;
});
