const expressRest = require('express-rest')
const Api = require('./api')

const apiConf = require(process.env.NAAS_API_TOKENS || '../../../api_token.json')

module.exports = function (server) {
  const rest = expressRest(server)
  new Api(rest, apiConf)
}