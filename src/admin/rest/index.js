const app = require('../server')
const expressRest = require('express-rest')
const rest = expressRest(app)
const Api = require('./api')

new Api(rest)