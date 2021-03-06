const express = require('express')
const app = express()
const port = process.env.NAAS_PORT || 3000

const server = app.listen(port, () => {
  console.log(`NAAS listening at http://localhost:${port}`)
})

module.exports = { app, server }