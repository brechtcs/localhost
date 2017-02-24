const Network = require('./discover')
const nginx = require('./nginx')
const server = require('./server')

const pino = require('pino')()

module.exports.start = function start (opts) {
  let pamphlets = []

  if (opts.nginx) {
    pamphlets = opts.nginx.reduce(function (list, path) {
      return nginx.getSites(path).concat(list)
    }, pamphlets)
  }

  const network = new Network({
    protocol: 'udp4',
    service: 'pamphlets',
    domains: pamphlets.filter(function (site, index, list) {
      return list.indexOf(site) === index
    })
  })


  network.on('join', update(network.hosts, server))
  network.on('leave', update(network.hosts, server))
  network.start()

  server.start(network.hosts(), opts)
}

function update (hosts, server) {
  server.update(hosts())
  return ip => pino.info(ip, hosts())
}
