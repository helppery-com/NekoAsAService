const expressRest = require('express-rest')
const Api = require('./api')

module.exports = function (server) {
  const rest = expressRest(server)
  new Api(rest)
}