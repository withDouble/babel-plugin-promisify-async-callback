const template = require('babel-template')

const CB_IDENTIFIER_NAME = 'cb'
const WRAPPED_CB_IDENTIFIER_NAME = `_${CB_IDENTIFIER_NAME}`

module.exports = function (babel) {
  const wrapInPromise = template(`{
    const FN = ${CB_IDENTIFIER_NAME} => BLOCK
    return new Promise((RESOLVE, REJECT) => {
      FN((() => {
        const ${WRAPPED_CB_IDENTIFIER_NAME} = function(err, ...args) {
          if (typeof ${CB_IDENTIFIER_NAME} === 'function') {
            ${CB_IDENTIFIER_NAME}(err, ...args)
          }
          if (err) {
            REJECT(err)
          }
          else {
            RESOLVE(...args)
          }
        }
        ${WRAPPED_CB_IDENTIFIER_NAME}.resolve = ${WRAPPED_CB_IDENTIFIER_NAME}.bind(null, null)
        ${WRAPPED_CB_IDENTIFIER_NAME}.reject = ${WRAPPED_CB_IDENTIFIER_NAME}
        return ${WRAPPED_CB_IDENTIFIER_NAME}
      })())
    })
  }`)

  return {
    visitor: {
      Function (path) {
        // Only promisify functions marked as async
        if (!path.node.async) {
          return
        }

        // Only promisify functions which last parameter has the specific name CB_IDENTIFIER_NAME
        const lastFunctionParamNode = path.node.params[path.node.params.length - 1]
        if (!babel.types.isIdentifier(lastFunctionParamNode, { name: CB_IDENTIFIER_NAME })) {
          return
        }

        const wrappedBody = wrapInPromise({
          BLOCK: path.node.body,
          FN: path.scope.generateUidIdentifier('fn'),
          RESOLVE: path.scope.generateUidIdentifier('resolve'),
          REJECT: path.scope.generateUidIdentifier('reject'),
        })

        path.node.body = wrappedBody
      },
    },
  }
}
