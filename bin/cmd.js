#!/usr/bin/node

const minimist = require('minimist')
const pamphlets = require('../lib/pamphlets')

pamphlets.start(minimist(process.argv))
