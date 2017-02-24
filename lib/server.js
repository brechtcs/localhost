module.exports = {
  reload: reload,
  start: start
}

const http = require('http')
const ip = require('ip')
const proxy = require('http-proxy')
const url = require('url')
const view = require('./localhost')

const pino = require('pino')()
const state = {}

/**
 * Public methods
 */
function reload (hosts) {
  state.server.close()
  start(hosts, state)
}

function start (hosts, opts) {
  const targets = filterLocal(hosts)
  state.overview = getOverview(hosts)
  state.port = opts.port || 8989
  state.server = http.createServer(function (req, res) {
    const param = getHostname(req)
    const host = req.headers.host || param
    if (isLocal(req) && host === 'localhost' && !param) {
      pino.info('Serving localhost portal')
      serveOverview(req, res, 200)
    }
    else if (isLocal(req) || (param && host)) {
      pino.info(`Proxying host request (${host})`)
      proxyRequest(targets[host], req, res)
    }
    else {
      pino.error('Remote connection rejected')
      serveOverview(req, res, 403)
    }
  }).listen(state.port)

  pino.info(`Running at port ${opts.port}`)
}

/**
 * Private methods
 */
function proxyRequest (targets, req, res) {
  if (host = searchHost(targets, req)) {
    pino.info(`Forwarding ${host}`)
    state.proxy = proxy.createProxyServer({target: 'http://' + host})
    state.proxy.web(req, res, function (err) {
      pino.error(err.toString(), `(forwarding ${host})`)
      proxyRequest(targets.slice(1), req, res)
    })
  }
  else if (param = getHostname(req)) {
    pino.info(`Serving ${param}`)
    state.proxy = proxy.createProxyServer({target: 'http://' + param})
    state.proxy.web(rewriteHost(req, param), res, function (err) {
      pino.error(err.toString(), `(serving ${param})`)
      serveOverview(req, res, 404)
    })
  }
  else {
    pino.error(`Error: unconfigured domain (${req.headers.host})`)
    serveOverview(req, res, 404)
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

function isLocal (req) {
  if (ip.isLoopback(req.connection.remoteAddress)) {
    return ip.isLoopback(req.headers['x-forwarded-for']) && ip.isLoopback(req.headers['x-real-ip'])
  }
  return false
}

function getHostname (req) {
  return url.parse(req.url, true).query['hostname'] || null
}

function searchHost (targets, req) {
  if (isLocal(req)) {
    return targets && targets[0]
  }
  return false
}

function rewriteHost (req, host) {
  req.headers.host = host
  return req
}
