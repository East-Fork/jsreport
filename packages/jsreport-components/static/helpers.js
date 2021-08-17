/* eslint-disable */
const __componentCache = {}
async function component (path, options) {  
  const jsreport = require('jsreport-proxy')    
  if (!__componentCache[path]) {
    if (path == null) {
      throw new Error('component helper requires path argument')
    }    
    
    const componentSearchResult = await jsreport.folders.resolveEntityFromPath(path, 'components', { currentPath: jsreport.currentPath })
    if (componentSearchResult == null) {
      throw new Error(`Component ${path} not found`)
    }
    __componentCache[path] = componentSearchResult.entity
  }
  const entity = __componentCache[path]

  const isHandlebars = typeof arguments[arguments.length - 1].lookupProperty === 'function'
  const isJsRender = this.tmpl && this.tmpl && typeof this.tmpl.fn === 'function'

  let currentContext
  if (isHandlebars) {
    currentContext = this
  }

  if (isJsRender) {
    currentContext = this.data
  } 

  try {       
    return await jsreport.templatingEngines.evaluate({
      engine: entity.engine,
      content: entity.content,
      helpers: entity.helpers,
      data: currentContext
    }, {
      entity,
      entitySet: 'components'      
    })
  } catch (e) {    
    if (e.entity == null) {
      e.message = `Error when evaluating templating engine for component ${path}\n${e.message}`
      e.entity = {
        shortid: entity.shortid,
        name: entity.name,
        content: entity.content
      }
      if (e.property !== 'content') {
        e.property = 'helpers'
      }      
    } 

    throw e
  }
}
