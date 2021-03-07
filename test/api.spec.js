
const request = require('request')
var expect  = require("chai").expect

const baseUrl = 'http://localhost:3000'

const DONT_USE_THIS_TOKEN = 'DONT_USE_THIS_TOKEN'
const NEITHER_THIS_ONE = 'NEITHER_THIS_ONE'

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

const get = async (path, token) => {
  return await asyncReq('get', {
      url: `${baseUrl}${path}`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}

const _delete = async (path, token) => {
  return await asyncReq('delete', {
      url: `${baseUrl}${path}`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
}

const post = async (path, json, token) => {
  return await asyncReq('post', {
      url: `${baseUrl}${path}`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      json
    })
}

const { server } = require('../src/index') // Run server

// Test
describe("Test API", function() {
  it("fails if not authenticated", async function() {
    const { response } = await get('/api/rooms')
    expect(response.statusCode).to.equal(500)
  })
  it("list all containers", async function() {
    const { response } = await get('/api/rooms', DONT_USE_THIS_TOKEN)
    expect(response.statusCode).to.equal(200)
  });
  it("returns a free port", async function() {
    const { body } = await post('/api/ports/free', { 
      protocol: 'tcp',
      lowerBound: 20000,
      count: 1,
      upperBound: 20001
    }, DONT_USE_THIS_TOKEN)
    expect(body).to.equal(20000)
  }, DONT_USE_THIS_TOKEN);
  it("creates a room", async function() {
    this.timeout(5000)
    const { body } = await post('/api/neko', { 
      maxMembers: 2
    }, DONT_USE_THIS_TOKEN)
    expect(body.name).to.not.be.empty
  });
  it("close all open rooms", async function() {
    this.timeout(60000)
    const { body: rooms } = await get('/api/rooms', DONT_USE_THIS_TOKEN)
    for(let ix in rooms) {
      const room = rooms[ix]
      const { response, body } = await _delete(`/api/neko/${room}`, DONT_USE_THIS_TOKEN)
      expect(response.statusCode).to.equal(200)
      expect(body.status).to.be.true
    }
    const { body: norooms } = await get('/api/rooms', DONT_USE_THIS_TOKEN)
    expect(norooms).to.be.empty
  })
  // Multi token
  it("fails reading others containers", async function() {
    // TODO: ..... too tired today :(
  })
});

after(async () => {  
  console.log('Closing server')
  server.close()
})