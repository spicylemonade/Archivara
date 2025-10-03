const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'

console.log(`Environment: ${process.env.NODE_ENV}`)
console.log(`Port: ${port}`)
console.log(`Dev mode: ${dev}`)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  server.listen(port, hostname, (err) => {
    if (err) {
      console.error('Failed to start server:', err)
      throw err
    }
    console.log(`> Server listening at http://${hostname}:${port}`)
    console.log(`> Ready to handle requests`)
  })
}).catch((err) => {
  console.error('Failed to prepare Next.js:', err)
  process.exit(1)
})