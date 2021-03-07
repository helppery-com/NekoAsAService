const { exception } = require('console');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { makeid } = require('../../utils')

const NAAS_TOKEN = process.env.NAAS_AUTH_TONE || 'DONT_USE_THIS_TOKEN'

class Api {
  constructor (rest, tokens) {
    this.tokens = tokens
    this.rest = rest

    this.NAAS_TCP_LOWERBOUND = parseInt(process.env.NAAS_TCP_LOWERBOUND || 9000)
    this.NAAS_TCP_UPPERBOUND = parseInt(process.env.NAAS_TCP_UPPERBOUND || 10000)
    this.NAAS_UDP_LOWERBOUND = parseInt(process.env.NAAS_UDP_LOWERBOUND || 59000)
    this.NAAS_UDP_UPPERBOUND = parseInt(process.env.NAAS_UDP_UPPERBOUND || 65000)
    this.NAAS_IMAGE = process.env.NAAS_IMAGE || 'm1k1o/neko:latest'
    this.NAAS_NETWORK = process.env.NAAS_NETWORK || 'naas'

    this.rest.get('/api/test', this.mep(this.test))
    this.rest.get('/api/rooms', this.mep(this.listDockerContainers))
    this.rest.post('/api/neko', this.mep(this.createNeko))
    this.rest.delete('/api/neko/:name', this.mep(this.deleteContainer))
    this.rest.get('/api/ports', this.mep(this.getMappedPorts))
    this.rest.post('/api/ports/free', this.mep(this.getFreePort))
  }

  checkToken (req) {
    const auth = req.headers.authorization || ""
    const token = auth.split('Bearer ')[1]
    if (!this.tokens[token]) {
      throw new Error( `Not authorized, expected  ${NAAS_TOKEN} got ${token} from ${auth}`)
    }
    return { $id: token, ...this.tokens[token] }
  }

  mep(ep) {
    ep = ep.bind(this)
    const oThis = this
    return (async function (req, res) {
      try {
      const $token = oThis.checkToken(req)
      res.ok(await ep({
          ...req.params,
          ...req.body,
          $req: req,
          $res: res,
          $ctx: this,
          $token
        }))
      } catch (ex) {
        console.error('Error processing request', req.url, req.body, req.headers, ex)
        res.internalServerError({ error: "" + ex })
      }
    }).bind(this)
  }

  test () {
    return { ok: 1 }
  }

  async getMappedPorts () {
    const { stdout, stderr } = await exec(`docker ps --format "{{.Ports}}"`)
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
    const ports = await this.getMappedPorts()
    const list = ports[protocol]
    while(lowerBound < upperBound) {
      if (list.indexOf(lowerBound) === -1) {
        let fullRange = lowerBound + count - 1
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

  async listDockerContainers ({ $token }) {
    const cmd = `docker ps -a --filter "label=naas.token=${$token.$id}" --format "{{.Names}}"`
    console.log(cmd)
    const { stdout, stderr } = await exec(cmd)
    if (stderr) {
      throw new Error(stderr)
    }
    return stdout.split('\n')
            .filter(l => l.length !== 0)
  }

  async newContainerName ({ namePattern, $token }) {
    namePattern = namePattern || 'xxx-xxx-xxxx'
    const names = await this.listDockerContainers({ $token })
    let name = makeid(namePattern)
    let attemps = 5
    while(attemps && names.indexOf(name) !== -1) {
      name = makeid(namePattern)
      attemps--
    }
    if (attemps === 0) {
      throw new Error('No valid container name found')
    }
    return name
  }

  async canCreateNeko({ $token, maxMembers }) {
    const current = await this.listDockerContainers({ $token })
    if (current.length >= $token.concurrent) {
      throw new Error('Token reached max number of running rooms')
    }
    if (maxMembers > $token.maxMembers) {
      throw new Error('maxMembers error')
    }
    return true
  }

  async createNeko({
    name,
    namePattern,
    maxMembers,
    image,
    password,
    adminPassword,
    $token
  }) {
    maxMembers = maxMembers || 2
    await this.canCreateNeko({ $token, maxMembers })
    const port = await this.getFreePort({
      protocol: 'tcp',
      lowerBound: this.NAAS_TCP_LOWERBOUND,
      count: 1,
      upperBound: this.NAAS_TCP_UPPERBOUND
    })
    const udpPort = await this.getFreePort({
      protocol: 'udp',
      lowerBound: this.NAAS_UDP_LOWERBOUND,
      count: maxMembers,
      upperBound: this.NAAS_UDP_UPPERBOUND
    })
    const epr = `${udpPort}-${udpPort + maxMembers}`
    if (!name) {
      name = await this.newContainerName({ namePattern, $token })
    }
    image = image || this.NAAS_IMAGE

    const tpl = `docker run -d \
      --shm-size=1gb \
      -p ${port}:8080 \
      -p ${epr}:${epr}/udp \
      -e NEKO_EPR=${epr} \
      -e NEKO_PASSWORD_ADMIN=${adminPassword || makeid('xxx-xxx-xxx')} \
      -e NEKO_PASSWORD=${password || makeid('xxx-xxx-xxx')} \
      --network ${this.NAAS_NETWORK} \
      --label naas.token=${$token.$id} \
      --name ${name} \
      ${image}`

    try {
      const { stdout, stderr } = await exec(tpl)
      return {
        port,
        epr,
        name,
        image,
        adminPassword,
        password,
        tpl,
        stdout
      }
    } catch (error) {
      await this.deleteContainer({ name })
      return { error }
    }
  }

  async deleteContainer({ name, $token }) {
    const current = await this.listDockerContainers({ $token })
    if (current.indexOf(name) === -1) {
      throw new Error('Container not found')
    }
    const { stdout, stderr } = await exec(`docker rm -f ${name}`)
    return { status: stderr ? stderr : stdout.trim() === name }
  }
}

module.exports = Api