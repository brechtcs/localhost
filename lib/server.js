module.exports = {
  reload: reload,
  start: start
}

const http = require('http')
const ip = require('ip')
const proxy = require('http-proxy')
const url = require('url')
const view = require('./localhost')
const state = {}

/**
 * Public methods
 */
function reload (hosts) {
  state.server.close()
  start(hosts, state.port)
}

function start (hosts, port) {
  const targets = filterLocal(hosts)
  state.overview = getOverview(hosts)
  state.port = port || 8989
  state.server = http.createServer(function (req, res) {
    const param = getHostname(req)
    const host = req.headers.host || param
    if (param && host) {
      proxyRequest(targets[host], req, res)
    }
    else {
      serveOverview(req, res, 200)
    }
  }).listen(state.port)
}

/**
 * Private methods
 */
function proxyRequest (targets, req, res) {
  if (host = searchHost(targets, req)) {
    state.proxy = proxy.createProxyServer({target: 'http://' + targets[0]})
    state.proxy.web(req, res, function (err) {
      console.warn(err.toString(), `(forwarding ${host})`)
      proxyRequest(targets.slice(1), req, res)
    })
  }
  else if (param = getHostname(req)) {
    state.proxy = proxy.createProxyServer({target: 'http://' + param})
    state.proxy.web(rewriteHost(req, param), res, function (err) {
      console.warn(err.toString(), `(serving ${param})`)
      serveOverview(req, res, 404)
    })
  }
}

function getOverview (hosts) {
  return function (status) {
    return view({
      sites: Object.keys(hosts),
      status: status
    }).toString()
  }
}

function serveOverview (req, res, status) {
  res.writeHead(status)
  res.end(state.overview(status))
}

function filterLocal (hosts) {
  return Object.keys(hosts).reduce(function (targets, name) {
    targets[name] = hosts[name].filter(address => address !== ip.address())
    return targets
  }, {})
}

function getHostname (req) {
  return url.parse(req.url, true).query['hostname'] || null
}

function searchHost (targets, req) {
  if (!ip.isLoopback(req.connection.remoteAddress)) {
    return false
  }
  return targets && targets[0]
}

function rewriteHost (req, host) {
  req.headers.host = host
  return req
}
