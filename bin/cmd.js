#!/usr/bin/node

const localhost = require('../lib/localhost')
const minimist = require('minimist')

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

localhost.start(opts)
