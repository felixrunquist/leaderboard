const withPlugins = require('next-compose-plugins');
const sass = require('sass')
const path = require('path')

module.exports = withPlugins([
  [sass, {
    includePaths: [path.join(__dirname, 'css'), path.join(__dirname, 'components'), path.join(__dirname, 'components/small')],
  }]
],{images: {
    domains: [
      ]
  },

  webpack: (config) => {

    return config;
  },
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  experimental: {
    esmExternals: 'loose'
  },
});
