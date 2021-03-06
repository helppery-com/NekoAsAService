const util = require('util');
const exec = util.promisify(require('child_process').exec);

const NAAS_TOKEN = process.env.NAAS_AUTH_TONE || 'DONT_USE_THIS_TOKEN'

class Api {
  constructor (rest) {
    this.rest = rest

    this.NAAS_TCP_LOWERBOUND = process.env.NAAS_TCP_LOWERBOUND || 9000
    this.NAAS_TCP_UPPERBOUND = process.env.NAAS_TCP_UPPERBOUND || 10000
    this.NAAS_UDP_LOWERBOUND = process.env.NAAS_UDP_LOWERBOUND || 59000
    this.NAAS_UDP_UPPERBOUND = process.env.NAAS_UDP_UPPERBOUND || 65000
    this.NAAS_IMAGE = process.env.NAAS_IMAGE || 'm1k1o/neko:latest'

    this.rest.get('/api/test', this.mep(this.test))
    this.rest.get('/api/rooms', this.mep(this.listDockerContainers))
    this.rest.post('/api/neko', this.mep(this.createNeko))
    this.rest.delete('/api/neko/:name', this.mep(this.deleteContainer))
    this.rest.get('/api/ports', this.mep(this.getMappedPorts))
    this.rest.post('/api/ports/free', this.mep(this.getFreePort))
  }

  checkToken (req) {
    const auth = req.headers.authentication || ""
    if (auth.split('Bearer ')[1] !== NAAS_TOKEN) {
      throw new Error('Not authorized')
    }
  }

  mep(ep) {
    ep = ep.bind(this)
    const oThis = this
    return (async function (req, res) {
      try {
      oThis.checkToken(req)
      res.ok(await ep({
          ...req.params,
          ...req.body,
          $req: req,
          $res: res,
          $ctx: this
        }))
      } catch (ex) {
        res.internalServerError(ex)
      }
    }).bind(this)
  }

  test () {
    return { ok: 1 }
  }

  async getMappedPorts () {
    const { stdout, stderr } = await exec('docker ps --format "{{.Ports}}"')
    /** stdout
     * 0.0.0.0:59101-59200->59101-59200/udp, 0.0.0.0:9081->8080/tcp
     * 0.0.0.0:59000-59100->59000-59100/udp, 0.0.0.0:9080->8080/tcp
     */
    if (stderr) {
      throw new Error(stderr)
    }
    const response = {
      tcp: [],
      udp: []
    }
    stdout.split('\n')
      .filter(l => l.trim().length !== 0)
      .forEach(l => {
        l.split(',')
          /** 0.0.0.0:59101-59200->59101-59200/udp
           **  0.0.0.0:9081->8080/tcp
          */
          .map(m => {
            m = m.split(':')[1].trim() // 59101-59200->59101-59200/udp
            const ports = m.split('->') // [59101-59200, 59101-59200/udp]
            const type = m.substring(m.length-3) // udp || tcp
            const range = ports[0].split('-').map(p => parseInt(p)) // [59101, 59200] || [9081]
            response[type].push(range[0])
            
            if (range.length === 2) {
              let r = range[0] + 1
              while(++r <= range[1]) { // Add full range
                response[type].push(r)
              }
            }
          })
        })
    response.tcp.sort()
    response.udp.sort()
    return response
  }

  async getFreePort({ protocol, lowerBound, count, upperBound }) {
    console.log('getFreePort', protocol, lowerBound, count, upperBound)
    const ports = await this.getMappedPorts()
    const list = ports[protocol]
    while(lowerBound < upperBound) {
      if (list.indexOf(lowerBound) === -1) {
        let fullRange = lowerBound + count
        while(fullRange > lowerBound) {
          if(list.indexOf(fullRange) !== -1) {
            break
          }
          fullRange--
        }
        if(fullRange === lowerBound) {
          return lowerBound
        } else {
          lowerBound = fullRange + 1
        }
      } else {
        lowerBound++
      }
    }
    throw new Error('No empty port found')
  }

  async listDockerContainers () {
    const { stdout, stderr } = await exec('docker ps --format "{{.Names}}"')
    if (stderr) {
      throw new Error(stderr)
    }
    return stdout.split('\n')
      .filter(n => n.startsWith('neko_'))
  }

  async createNeko({ maxMembers, image }) {
    const port = await this.getFreePort({
      protocol: 'tcp',
      lowerBound: this.NAAS_TCP_LOWERBOUND,
      count: 1,
      upperBound: this.NAAS_TCP_UPPERBOUND
    })
    const udpPort = await this.getFreePort({
      protocol: 'udp',
      lowerBound: this.NAAS_UDP_LOWERBOUND,
      count: maxMembers || 10,
      upperBound: this.NAAS_UDP_UPPERBOUND
    })
    const epr = `${udpPort}-${udpPort + maxMembers}`
    const name = `neko_${port}`
    image = image || this.NAAS_IMAGE

    const tpl = `docker run -d \
      --shm-size=1gb \
      -p ${port}:8080 \
      -p ${epr}:${epr}/udp \
      -e NEKO_EPR=${epr} \
      --name ${name} \
      ${image}`
    const { stdout, stderr } = await exec(tpl)
    return {
      port,
      epr,
      name,
      image,
      tpl,
      stdout,
      stderr
    }
  }

  async deleteContainer({ name }) {
    const { stdout, stderr } = await exec(`docker rm -f ${name}`)
    return { status: stderr ? stderr : stdout.trim() === name }
  }
}

module.exports = Api