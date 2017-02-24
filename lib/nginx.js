const fs = require('fs')
const glob = require('glob')
const parser = require('nginx-config-parser')

module.exports.getSites = function getSites(path) {
  const config = getFullConfig(path || '/etc/nginx/nginx.conf')
  const tree = parser.queryFromString(config)

  return tree.find('http').find('server').reduce(function (sites, server) {
    if (server.server_name && server.server_name[0]) {
      return sites.concat(server.server_name[0].slice(0, 1))
    }
    return sites
  }, []).filter(function (site) {
    return site !== '_'
  })
}

function getFullConfig (path) {
  const include = /include[\s+](.+);/
  let config = fs.readFileSync(path, 'utf-8')

  while (match = include.exec(config)) {
    const files = glob.sync(match[1]).map(function (path) {
      return fs.readFileSync(path, 'utf-8')
    }).reduce(function (concat, file) {
      return concat + file
    }, '')

    config = config.replace(include, files)
  }

  return config
}
