module.exports = (reporter, definition) => {
  reporter.beforeRenderListeners.add(definition.name, this, async (req, res) => {
    req.context.systemHelpers += `function browserClientLink() {
      const jsreport = require('jsreport-proxy')
      if (!jsreport.req.context.http || !jsreport.req.context.http.baseUrl) {
        throw new Error('browserClientLink requires context.http.baseUrl to be set')
      }
      return jsreport.req.context.http.baseUrl + '/extension/browser-client/public/js/jsreport.umd.js'
    }` + '\n'
  })

  function recipe (request, response) {
    response.meta.contentType = 'text/html'
    response.meta.fileExtension = 'html'

    if (!request.context.http || !request.context.http.baseUrl) {
      throw reporter.createError('html-with-browser-client requires context.http.baseUrl to be set', {
        statusCode: 400,
        weak: true
      })
    }

    const script = `<script src="${request.context.http.baseUrl}/extension/browser-client/public/js/jsreport.umd.js"></script>`
    const content = response.content.toString()
    const endBody = content.search(/<\/body\s*>/)
    response.content = Buffer.from(endBody === -1 ? (script + content) : content.substring(0, endBody) + script + content.substring(endBody))
  }

  reporter.extensionsManager.recipes.push({
    name: 'html-with-browser-client',
    execute: recipe
  })
}
