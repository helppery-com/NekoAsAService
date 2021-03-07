const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomString (length) {
  var result = ''
  var charactersLength = characters.length
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}
function makeid (pattern, separator) {
  separator = separator || '-'
  const slots = pattern.split(separator)
  for(let c in slots) {
    slots[c] = randomString(slots[c].length)
  }
  return slots.join(separator)
}
module.exports = {
  makeid,
  randomString
}