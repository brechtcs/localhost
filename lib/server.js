module.exports = {
  start: start,
  update: update
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
function start (hosts, opts) {
  const domains = getDomains(hosts)  
  state.nginx = opts.nginx
  state.port = opts.port || 8989
  state.overview = getOverview(domains)
  state.targets = filterLocal(domains)
  state.server = http.createServer(function (req, res) {
    const param = getHostname(req)
    const host = req.headers.host || param
    if (isLocal(req) && host === 'localhost' && !param) {
      pino.info('Serving localhost portal')
      serveOverview(req, res, 200)
    }
    else if (isLocal(req) || (param && host)) {
      pino.info(`Proxying host request (${host})`)
      proxyRequest(state.targets[host], req, res)
    }
    else {
      pino.error(`Remote connection rejected (${host})`)
      serveOverview(req, res, 403)
    }
  }).listen(state.port)

  pino.info(`Running at port ${opts.port}`)
}

function update (hosts) {
  const domains = getDomains(hosts)  
  state.overview = getOverview(domains)
  state.targets = filterLocal(domains)
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

function getOverview (domains) {
  return function (status) {
    return view({
      sites: domains,
      status: status
    }).toString()
  }
}

function serveOverview (req, res, status) {
  res.writeHead(status)
  res.end(state.overview(status))
}

function getDomains (hosts) {
  return Object.keys(hosts).reduce(function (targets, address) {
    hosts[address].domains.forEach(function (domain) {
      if (!targets[domain]) {
        targets[domain] = [address]
      }
      else if (targets[domain].indexOf(address) === -1){
        targets[domain].push(address)
      }
    })
    return targets
  }, {})
}

function filterLocal (domains) {
  return Object.keys(domains).reduce(function (targets, name) {
    targets[name] = domains[name].filter(address => address !== ip.address())
    return targets
  }, {})
}

function isLocal (req) {
  if (ip.isLoopback(req.connection.remoteAddress)) {
    return state.nginx ? ip.isLoopback(req.headers['x-forwarded-for']) && ip.isLoopback(req.headers['x-real-ip']) : true
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
