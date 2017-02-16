const http = require('http')
const proxy = require('http-proxy').createProxyServer({})
const state = {}

function forward (targets, req, res) {
  if (targets && targets.length) {
    const target = targets.shift()

    proxy.web(req, res, {target: 'http://' + target})
    proxy.on('error', function (err) {
      forward(req, res, targets)
    })
  }
  else {
    res.writeHead(400)
    res.end('Not found.')
  }
}

function reload (hosts) {
  state.server.close()
  start(hosts, state.port)
}

function start (hosts, port) {
  state.port = port || 8989
  state.server = http.createServer(function (req, res) {
    forward(hosts[req.headers.host], req, res)
  }).listen(state.port)
}

module.exports = {
  reload: reload,
  start: start
}
