const html = require('bel')

module.exports = function (opts) {
  const list =  html`<div>
    ${Object.keys(opts.sites).map(name => ({name: name, link: opts.sites[name][0]})).map(link)}
  </div>`

  return base(list, opts)
}

function base (content, opts) {
  return html`
    <!doctype html>
    <html>
      <head>
        <title>localhost</title>
      </head>
      <body>
        <div>${opts.status}</div>
        ${opts.status === 403 ? '' : content}
      </body>
    </html>
  `
}

function link (site) {
  if (site.link) {
    return html`<div>
      <a href="http://${site.link}?hostname=${site.name}">${site.name}</a>
    </div>`
  }
  return ''
}
