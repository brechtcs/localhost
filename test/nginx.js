const nginx = require('../lib/nginx')

nginx.getSites().forEach(site => console.log(site))
