const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const app = require('./server')

let server
let base

before(async () => {
  server = app.listen(0)

  await new Promise((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })

  base = `http://127.0.0.1:${server.address().port}`
})

after(() => {
  if (server) server.close()
})

test('en kund kan INTE se en annan kunds fakturor via customerNo', async () => {
  const loginResponse = await fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'anna.andersson@example.com',
      password: 'sommar2026'
    })
  })

  assert.equal(loginResponse.status, 200)

  const { token } = await loginResponse.json()
  assert.ok(token, 'Inloggningen ska returnera en token')

  const response = await fetch(
    `${base}/api/invoices?customerNo=K-208811`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  assert.equal(response.status, 200)

  const invoices = await response.json()

  // Anna ska få sina fyra fakturor, inte Bos två.
  assert.equal(invoices.length, 4)
  assert.ok(
    invoices.every(invoice => invoice.id.startsWith('F-2026-')),
    'Svaret ska innehålla Annas fakturor'
  )
})