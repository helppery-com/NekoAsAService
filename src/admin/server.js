const express = require('express')
const app = express()
const port = process.env.NAAS_ADMIN_PORT || 3000

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

module.exports = app