const Network = require('./discover')
const nginx = require('./nginx')

module.exports.start = function start (opts) {
  const pamphlets = nginx.getSites()
  const network = new Network({
    protocol: 'udp4',
    service: 'pamphlets',
    domains: pamphlets
  })

  network.on('join', ip => console.log(Object.keys(network.hosts()).join(', ')))
  network.on('leave', ip => console.log(Object.keys(network.hosts()).join(', ')))
  network.start()
}
