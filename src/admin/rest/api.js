const util = require('util');
const exec = util.promisify(require('child_process').exec);

class Api {
  constructor (rest) {
    this.rest = rest

    this.rest.get('/test', this.mep(this.test))
    this.rest.get('/rooms', this.mep(this.listDockerContainers))
    this.rest.post('/neko', this.mep(this.createNeko))
    this.rest.delete('/neko/:name', this.mep(this.deleteContainer))
  }

  mep(ep) {
    ep = ep.bind(this)
    return (async function (req, res) {
      try {
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

  async listDockerContainers () {
    const { stdout, stderr } = await exec('docker ps')
    return { stdout, stderr }
  }

  async createNeko({ settings }) {
    const port = settings.NEKO_BIND.split(':')[1]
    const tpl = `docker run -d \
      --shm-size=1gb \
      -p ${port}:8080 \
      -p ${settings.NEKO_EPR}:${settings.NEKO_EPR}/udp \
      -e NEKO_EPR=${settings.NEKO_EPR} \
      --name neko_${port} \
      m1k1o/neko:latest`
    const { stdout, stderr } = await exec(tpl)
    return { tpl, stdout, stderr }
  }

  async deleteContainer({ name }) {
    const { stdout, stderr } = await exec(`docker rm -f ${name}`)
    return { tpl, stdout, stderr }
  }
}

module.exports = Api