#!/usr/bin/node

const minimist = require('minimist')
const pamphlets = require('../lib/pamphlets')

const argv = minimist(process.argv)
const opts = {}

if (argv.port || argv.p) {
  opts.port = parseInt(argv.port || argv.p)
}

if (argv.nginx || argv.n) {
  opts.nginx = [argv.nginx || argv.n].reduce(function (list, item) {
    if (Array.isArray(item)) {
      list = list.concat(item)
    }
    else if (typeof item === 'string') {
      list = list.concat([item])
    }
    else {
      list = list.concat(null)
    }
    return list
  }, [])
}

pamphlets.start(opts)
