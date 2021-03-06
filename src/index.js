const { app, server } = require('./server')
const admin = require('./admin')
const web = require('./web')

admin(app)
web(app)

if (module) {
  module.exports = { app, server }
}