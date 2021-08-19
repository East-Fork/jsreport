const toArray = require('stream-to-array')
const electronConvert = require('electron-html-to')

module.exports = (reporter, definition, conversion) => async (request, response) => {
  request.template.electron = request.template.electron || {}
  request.template.electron.timeout = reporter.options.reportTimeout

  reporter.logger.debug('Electron Pdf recipe start.', request)

  const options = request.template.electron

  // TODO: add support for header and footer html when electron support printing header/footer
  const result = await conversion({
    html: response.content,
    delay: options.printDelay,
    timeout: options.timeout,
    waitForJS: options.waitForJS != null ? options.waitForJS : false,
    waitForJSVarName: 'JSREPORT_READY_TO_START',
    converterPath: electronConvert.converters.PDF,
    browserWindow: {
      width: options.width,
      height: options.height,
      webPreferences: {
        javascript: !(options.blockJavaScript != null ? options.blockJavaScript : false)
      }
    },
    pdf: {
      marginsType: options.marginsType,
      pageSize: parseIfJSON(options.format),
      printBackground: options.printBackground != null ? options.printBackground : true,
      landscape: options.landscape != null ? options.landscape : false
    }
  })

  const numberOfPages = result.numberOfPages

  response.meta.contentType = 'application/pdf'
  response.meta.fileExtension = 'pdf'
  response.meta.numberOfPages = numberOfPages

  if (Array.isArray(result.logs)) {
    result.logs.forEach((msg) => {
      reporter.logger[msg.level](msg.message, { timestamp: msg.timestamp.getTime(), ...request })
    })
  }

  const arr = await toArray(result.stream)

  response.content = Buffer.concat(arr)
  reporter.logger.debug(`electron-pdf recipe finished with ${numberOfPages} pages generated`, request)
}

function parseIfJSON (val) {
  if (typeof val === 'object') {
    return val
  }

  try {
    return JSON.parse(val)
  } catch (e) {
    return val
  }
}