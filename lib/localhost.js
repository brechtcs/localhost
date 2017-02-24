const html = require('bel')

module.exports = function (opts) {
  const list =  html`<div>
    ${opts.sites.map(link)}
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
  return html`<div>
    <a href="http://localhost?hostname=${site}">${site}</a>
  </div>`
}
