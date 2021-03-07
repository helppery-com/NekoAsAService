# NekoAsAService
NaaS Neko as a Service

Unofficial initiative to deploy multiple [Neko](https://github.com/nurdism/neko) instances on different cloud providers

# Api

## Authentication
Bearer authentication

    Authentication: Bearer TOKEN

## Methods

> Create room

    POST /api/neko
    { 
      "name: "room-name",
      "maxMembers": 10,
      "image": "m1k1o/neko:latest",
      "password", "",
      "adminPassword": ""
    }`

|Parameter| Description|
|--|--|
name | room name
namePattern | like %%%-%%%-%%%
maxMembers | 10
image | m1k1o/neko:latest
password |
adminPassword |


>Delete room

    DELETE /aopi/neko/:name

> Other methods

    Check test/api.spec.js :)

# Environment variables

  |Env|Description| Default|
  |--|--|--|
  |NAAS_API_TOKENS| File path for Api tokens (see below)|DONT_USE_THIS_TOKEN|
  |NAAS_PORT | TCP port where NekoAsAService will be listening|3000|
  |NAAS_TCP_LOWERBOUND|Lower bound for Neko TCP bind port|9000|
  |NAAS_TCP_UPPERBOUND|Upper bound for Neko TCP bind port|10000|
  |NAAS_UDP_LOWERBOUND|Lower bound for Neko UDP EPR port|59000|
  |NAAS_UDP_UPPERBOUND|Upper bound for Neko UDP EPR port|65000|
  |NAAS_IMAGE|Neko room image|m1k1o/neko:latest|

## Api token files
Api uses `Bearer TOKEN` authentication
Prtovide a JSON file with the tokens allowed and limitations

*Dev api_token.file*

    {
      "DONT_USE_THIS_TOKEN": {
        "concurrent": 1,
        "maxUsers": 2
      },
      "NEITHER_THIS_ONE": {
        "concurrent": 2,
        "maxUsers": 4
      }
    }
## Development

    Usage:
    npm run service
    npm run test

### Resources
 * https://github.com/FiloSottile/mkcert
# docker

> Requires: docker-compose version 1.27.4, build 40524192
### Build

    docker-compose build

### run
*Change settings accordingly to your environment*

    NAAS_HTTP=9000 \
    NAAS_HTTPS=9443 \
    NAAS_CERT=~/localhost+2.pem \
    NAAS_PRIVKEY=~/localhost+2-key.pem \
    docker-compose up -d



|Env|Description| Default|
|--|--|--|
|NAAS_HTTP| Proxy HTTP port | 9000|
|NAAS_HTTPS| Proxy SSL port | 9443|
|NAAS_CERT| Path to cert.pem ||
|NAAS_PRIVKEY| Path to privkey.pem ||
