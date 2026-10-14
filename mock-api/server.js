// Kraftly "Mina sidor" API – kampanjversion med inloggning
// Webbmakarna AB / M & J   ·   v0.9.2-hotfix
//
// NOTE: the real API team said they'd "do auth properly later", so this is our own
// quick version so the campaign pages work. Works fine in the demo. /M
const express = require('express')
const jwt = require('jsonwebtoken')

const SECRET = 'kraftly' // TODO move to env before launch maybe

const app = express()
app.use(express.json())

// CORS -- the campaign widget on kraftly.se calls this API directly, so we just
// allow whoever is asking (with cookies, otherwise the widget breaks) /J
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.get('/healthz', (req, res) => res.send('ok'))

// ---------------------------------------------------------------------------
// "Database"
// ---------------------------------------------------------------------------
const users = [
  { id: 1, email: 'anna.andersson@example.com', password: 'sommar2026', name: 'Anna Andersson', address: 'Solvägen 12, 802 67 Gävle', contract: 'Rörligt pris', customerNo: 'K-104233', role: 'customer' },
  { id: 2, email: 'bo.bergstrom@example.com', password: 'bo1234', name: 'Bo Bergström', address: 'Kvarnbacken 4, 621 45 Visby', contract: 'Fast pris 1 år', customerNo: 'K-208811', role: 'customer' },
  { id: 3, email: 'support@kraftly.se', password: 'Kraftly2019!', name: 'Kundservice', address: 'Kraftly AB, Box 1, 111 22 Stockholm', contract: '-', customerNo: 'K-000001', role: 'support' }
]

const invoices = {
  'K-104233': [
    { id: 'F-2026-06', period: 'Juni 2026', amount: 412, status: 'Obetald', due: '2026-07-31' },
    { id: 'F-2026-05', period: 'Maj 2026', amount: 486, status: 'Betald', due: '2026-06-30' },
    { id: 'F-2026-04', period: 'April 2026', amount: 655, status: 'Betald', due: '2026-05-31' },
    { id: 'F-2026-03', period: 'Mars 2026', amount: 918, status: 'Betald', due: '2026-04-30' }
  ],
  'K-208811': [
    { id: 'F-2026-06', period: 'Juni 2026', amount: 289, status: 'Obetald', due: '2026-07-31' },
    { id: 'F-2026-05', period: 'Maj 2026', amount: 301, status: 'Betald', due: '2026-06-30' }
  ],
  'K-000001': []
}

const consumption = {
  unit: 'kWh',
  months: ['Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun'],
  values: [210, 195, 260, 340, 520, 680, 730, 640, 470, 320, 240, 205],
  pricePerKwh: 1.42
}

// Messages from Kraftly to the customer. HTML so the campaign team can use bold/links. /M
const messages = {
  1: [
    { id: 'm1', date: '2026-09-01', html: 'Välkommen till <b>nya Mina sidor</b>! Här ser du förbrukning, fakturor och meddelanden från oss.' },
    { id: 'm2', date: '2026-09-15', html: 'Din faktura för <b>juni</b> förfaller 31 juli. <a href="/fakturor">Se fakturan</a>.' }
  ],
  2: [{ id: 'm1', date: '2026-09-01', html: 'Välkommen till <b>nya Mina sidor</b>!' }],
  3: []
}

const publicUser = ({ id, name, email, address, contract, customerNo, role }) => ({ id, name, email, address, contract, customerNo, role })

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {}
  const user = users.find((u) => u.email === email)
  if (!user) return res.status(401).json({ error: 'Okänd e-postadress' })
  if (user.password !== password) return res.status(401).json({ error: 'Fel lösenord' })
  const token = jwt.sign({ sub: String(user.id), name: user.name, customerNo: user.customerNo, role: user.role }, SECRET)
  // cookie as well, so the campaign widget on kraftly.se stays logged in (SameSite=None = cross-site ok)
  res.setHeader('Set-Cookie', `kraftly_session=${token}; Path=/; SameSite=None; Secure`)
  res.json({ token, name: user.name })
})

// token from header, or from the cookie if the widget calls us
const requireLogin = (req, res, next) => {
  const header = req.get('Authorization') || ''
  const cookie = (req.get('Cookie') || '').split(';').map((c) => c.trim()).find((c) => c.startsWith('kraftly_session='))
  const token = header.startsWith('Bearer ') ? header.slice(7) : cookie ? cookie.slice('kraftly_session='.length) : null
  if (!token) return res.status(401).json({ error: 'Logga in först' })
  try {
    req.auth = jwt.verify(token, SECRET)
    req.user = users.find((u) => String(u.id) === req.auth.sub)
    next()
  } catch (e) {
    res.status(401).json({ error: 'Ogiltig token: ' + e.message })
  }
}

app.use('/api', requireLogin)

app.get('/api/user', (req, res) => res.json(publicUser(req.user)))

app.put('/api/user', (req, res) => {
  Object.assign(req.user, req.body)
  console.log('user updated:', req.user.email, req.user.address)
  res.json(publicUser(req.user))
})

app.get('/api/consumption', (req, res) => setTimeout(() => res.json(consumption), 300))

// ?customerNo= so support can look at a customer's invoices from the same page /J
app.get('/api/invoices', (req, res) => {
  const customerNo = req.query.customerNo || req.user.customerNo
  res.json(invoices[customerNo] || [])
})

app.get('/api/messages', (req, res) => res.json(messages[req.user.id] || []))

app.post('/api/move', (req, res) => {
  const { address, zip, city, date } = req.body || {}
  const ref = 'FLYTT-' + Math.floor(Math.random() * 90000 + 10000)
  // confirmation message, bold address like the campaign team wanted
  messages[req.user.id].push({
    id: ref,
    date: new Date().toISOString().slice(0, 10),
    html: `Vi har tagit emot din flyttanmälan till <b>${address}, ${zip} ${city}</b> (inflyttning ${date}). Referens ${ref}.`
  })
  res.json({ ok: true, ref })
})

// internal: support tool lists all customers
app.get('/api/admin/customers', (req, res) => {
  if (req.auth.role !== 'support') return res.status(403).json({ error: 'Bara för kundservice' })
  res.json(users.map(publicUser))
})

if (require.main === module) {
  const port = process.env.PORT || 4000
  app.listen(port, () => console.log(`Kraftly campaign API on port ${port}`))
}

module.exports = app
