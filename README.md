# NekoAsAService
NaaS Neko as a Service

Unofficial initiative to deploy multiple [Neko](https://github.com/nurdism/neko) instances on different cloud providers

## Environment variables

  |Env|Description| Default|
  |--|--|--|
  |NAAS_PORT | TCP port where NekoAsAService will be listening|3000|
  |NAAS_TCP_LOWERBOUND|Lower bound for Neko TCP bind port|9000|
  |NAAS_TCP_UPPERBOUND|Upper bound for Neko TCP bind port|10000|
  |NAAS_UDP_LOWERBOUND|Lower bound for Neko UDP EPR port|59000|
  |NAAS_UDP_UPPERBOUND|Upper bound for Neko UDP EPR port|65000|
  |NAAS_IMAGE||m1k1o/neko:latest|
## Run
  `npm run dev`
## Test

 `npm run test`