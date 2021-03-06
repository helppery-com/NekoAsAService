
const request = require('request')
var expect  = require("chai").expect

const baseUrl = 'http://localhost:3000'

const asyncReq = async (method, settings) => new Promise((resolve, reject) => {
  request[method](settings,
  function(error, response, body) {
    if (error) {
      reject(error)
    } else {
      const status = response.statusCode
      try {
        body = status === 200 ? JSON.parse(body) : body
      } catch (ex) {
        console.error('Error coverting to JSON', ex, body)
      }
      resolve({ response, body })
    }
  })
})

const get = async (path, auth) => {
  return await asyncReq('get', {
      url: `${baseUrl}${path}`,
      headers: {
        Authentication: `Bearer ${auth === false ? '': 'DONT_USE_THIS_TOKEN' }`
      }
    })
}

const _delete = async (path, auth) => {
  return await asyncReq('delete', {
      url: `${baseUrl}${path}`,
      headers: {
        Authentication: `Bearer ${auth === false ? '': 'DONT_USE_THIS_TOKEN' }`
      }
    })
}

const post = async (path, json, auth) => {
  return await asyncReq('post', {
      url: `${baseUrl}${path}`,
      headers: {
        Authentication: `Bearer ${auth === false ? '': 'DONT_USE_THIS_TOKEN' }`
      },
      json
    })
}

const { server } = require('../src/index') // Run server

// Test
describe("Test API", function() {
  it("fails if not authenticated", async function() {
    const { response } = await get('/api/rooms', false)
    expect(response.statusCode).to.equal(500)
  })
  it("list all containers", async function() {
    const { response } = await get('/api/rooms')
    expect(response.statusCode).to.equal(200)
  });
  it("returns a free port", async function() {
    const { body } = await post('/api/ports/free', { 
      protocol: 'tcp',
      lowerBound: 20000,
      count: 1,
      upperBound: 20001
    })
    expect(body).to.equal(20000)
  });
  it("creates a room", async function() {
    const { body } = await post('/api/neko', { 
      maxMembers: 10
    })
    expect(body.name).to.not.be.empty
  });
  it("close all open rooms", async function() {
    this.timeout(60000)
    const { body: rooms } = await get('/api/rooms')
    for(let ix in rooms) {
      const room = rooms[ix]
      const { response, body } = await _delete(`/api/neko/${room}`)
      expect(response.statusCode).to.equal(200)
      expect(body.status).to.be.true
    }
    const { body: norooms } = await get('/api/rooms')
    expect(norooms).to.be.empty
  })

});

after(async () => {  
  console.log('Closing server')
  server.close()
})