const rest = require('./rest')
const proxy = require('./proxy')

module.exports = function (app) {
  rest(app)
  proxy(app)
}