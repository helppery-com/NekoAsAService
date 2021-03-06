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
    { maxMembers: 10 }`

>Delete room

    DELETE /aopi/neko/:name

> Other methods

    Check test/api.spec.js :)

# Environment variables

  |Env|Description| Default|
  |--|--|--|
  |NAAS_TOKEN| Bearer authentication token|DONT_USE_THIS_TOKEN|
  |NAAS_PORT | TCP port where NekoAsAService will be listening|3000|
  |NAAS_TCP_LOWERBOUND|Lower bound for Neko TCP bind port|9000|
  |NAAS_TCP_UPPERBOUND|Upper bound for Neko TCP bind port|10000|
  |NAAS_UDP_LOWERBOUND|Lower bound for Neko UDP EPR port|59000|
  |NAAS_UDP_UPPERBOUND|Upper bound for Neko UDP EPR port|65000|
  |NAAS_IMAGE||m1k1o/neko:latest|
## Run
  `npm run service`
## Test

 `npm run test`

 ## docker

### Build

    docker-compose build

### run

    docker-compose up -d