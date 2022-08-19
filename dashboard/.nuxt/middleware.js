const middleware = {}

middleware['authenticated'] = require('../node_modules/@rancher/shell/middleware/authenticated.js')
middleware['authenticated'] = middleware['authenticated'].default || middleware['authenticated']

middleware['i18n'] = require('../node_modules/@rancher/shell/middleware/i18n.js')
middleware['i18n'] = middleware['i18n'].default || middleware['i18n']

middleware['unauthenticated'] = require('../node_modules/@rancher/shell/middleware/unauthenticated.js')
middleware['unauthenticated'] = middleware['unauthenticated'].default || middleware['unauthenticated']

export default middleware
