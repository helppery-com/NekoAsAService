const http_port = process.env.NAAS_HTTP_PORT || 8080
const https_port = process.env.NAAS_HTTPS_PORT
const letsencrypt = process.env.NAAS_LETSENCRYPT

const proxy = require('redbird')({
  port: http_port, // http port is needed for LetsEncrypt challenge during request / renewal. Also enables automatic http->https redirection for registered https routes.
  letsencrypt: letsencrypt ? {
    path: __dirname + '/../certs',
    port: 9999 // LetsEncrypt minimal web server port for handling challenges. Routed 80->9999, no need to open 9999 in firewall. Default 3000 if not defined.
  } : null,
  ssl: https_port ? {
    http2: true,
    port: https_port, // SSL port used to serve registered https routes with LetsEncrypt certificate.
  } : null
});

proxy.register(`localhost:${http_port}`, "https://www.google.com")

module.exports = proxy