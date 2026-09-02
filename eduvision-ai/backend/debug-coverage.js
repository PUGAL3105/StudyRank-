const http = require('http')
const jwt = require('jsonwebtoken')

const token = jwt.sign({ userId: 'admin-1', email: 'admin@demo.com', role: 'admin' }, 'your-secret-key', { expiresIn: '1h' })

const req = http.request({
  hostname: 'localhost', port: 5000,
  path: '/api/admin/content-coverage', method: 'GET',
  headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
}, res => {
  let d = ''
  res.on('data', c => d += c)
  res.on('end', () => {
    const r = JSON.parse(d)
    const data = r.data || {}
    console.log('readyChapters:', data.readyChapters)
    console.log('pendingChapters:', data.pendingChapters)
    console.log('coveragePercentage:', data.coveragePercentage + '%')
    console.log('configuredChapters:', data.configuredChapters)
    console.log('chapters:')
    ;(data.chapters || []).forEach(c => {
      console.log(' ' + c.chapterId + ': status=' + c.status + ' chunks=' + c.chunkCount + ' pages=' + c.pageCount)
    })
  })
})
req.on('error', e => console.error(e))
req.end()
