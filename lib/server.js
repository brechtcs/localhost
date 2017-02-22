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
  const targets = filterSelf(hosts)
  state.overview = getOverview(hosts)
  state.port = port || 8989
  state.server = http.createServer(function (req, res) {
    const param = getSite(req)
    const host = req.headers.host || param
    if (param && host) {
      proxyRequest(targets[host], req, res)
    }
    else {
      res.writeHead(200)
      res.end(state.overview(res.statusCode))
    }
  }).listen(state.port)
}

/**
 * Private methods
 */
function getOverview (hosts) {
  return function (status) {
    return view({
      sites: Object.keys(hosts),
      status: status
    }).toString()
  }
}

function proxyRequest (targets, req, res) {
  if (doSearch(targets, req)) {
    state.proxy = proxy.createProxyServer({target: 'http://' + targets[0]})
    state.proxy.web(req, res, function (err) {
      console.warn(err.toString(), `(forwarding ${targets[0]})`)
      proxyRequest(targets.slice(1), req, res)
    })
  }
  else if (site = getSite(req)) {
    state.proxy = proxy.createProxyServer({target: 'http://' + site})
    state.proxy.web(rewriteHost(req, site), res, function (err) {
      console.warn(err.toString(), `(serving ${site})`)
      res.writeHead(404)
      res.end(state.overview(res.statusCode))
    })
  }
}

function rewriteHost (req, host) {
  req.headers.host = host
  return req
}

function doSearch (targets, req) {
  if (!ip.isLoopback(req.connection.remoteAddress)) {
    return false
  }
  return targets && targets.length
}

function filterSelf (hosts) {
  return Object.keys(hosts).reduce(function (targets, name) {
    targets[name] = hosts[name].filter(address => address !== ip.address())
    return targets
  }, {})
}

function getSite (req) {
  return url.parse(req.url, true).query['hostname'] || null
}
