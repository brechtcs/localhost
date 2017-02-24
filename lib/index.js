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


  network.on('join', update('Joined', network.hosts, server))
  network.on('leave', update('Left', network.hosts, server))
  network.start()

  server.start(network.hosts(), opts)
}

function update (msg, hosts, server) {
  return function (ip) {
    server.update(hosts())
    pino.info(`${msg}: ${ip} ${domains(hosts()[ip])}`)
  }
}

function domains (host) {
  if (host && host.domains && host.domains.length) {
    return `(${host.domains.join(', ')})`
  }
  return ''
}
