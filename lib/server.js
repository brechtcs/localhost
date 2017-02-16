const http = require('http')
const proxy = require('http-proxy').createProxyServer({})

let server

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
  server.close()
  start(hosts)
}

function start (hosts) {
  server = http.createServer(function (req, res) {
    forward(hosts[req.headers.host], req, res)
  }).listen(19588)
}

module.exports = {
  reload: reload,
  start: start
}
