const Network = require('./discover')
const nginx = require('./nginx')
const server = require('./server')

module.exports.start = function start (opts) {
  const pamphlets = nginx.getSites()
  const network = new Network({
    protocol: 'udp4',
    service: 'pamphlets',
    domains: pamphlets
  })


  network.on('join', () => server.reload(network.hosts()))
  network.on('leave', () => server.reload(network.hosts()))
  network.start()

  server.start(network.hosts())
}
