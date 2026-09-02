const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, '..', 'frontend', 'dist')
const bannedPatterns = [
  'OPENAI_API_KEY',
  'DATABASE_URL',
  'JWT_SECRET',
  'sk-',
  'postgres://',
  'postgresql://',
]

function scanDirectory(dir) {
  let leaks = []
  if (!fs.existsSync(dir)) return leaks
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      leaks = leaks.concat(scanDirectory(fullPath))
    } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8')
      for (const pattern of bannedPatterns) {
        if (content.includes(pattern)) {
          leaks.push({ file: fullPath, pattern })
        }
      }
    }
  }
  return leaks
}

console.log('\n======================================================================')
console.log('  PHASE 31: PRODUCTION FRONTEND SECRET LEAK AUDIT')
console.log('======================================================================\n')

const leaks = scanDirectory(distDir)
if (leaks.length === 0) {
  console.log('  ✓ [SECRET AUDIT] Scanning frontend/dist bundle...')
  console.log('  ✓ [SECRET AUDIT] Checked patterns: OPENAI_API_KEY, DATABASE_URL, JWT_SECRET, sk-, postgres://, postgresql://')
  console.log('  ✓ [SECRET AUDIT] Leaks found: 0')
  console.log('\n======================================================================')
  console.log('  SECRET AUDIT RESULT: PASS (0 SECRET LEAKS)')
  console.log('======================================================================\n')
  process.exit(0)
} else {
  console.error('  ✗ [SECRET AUDIT] FAILED! Detected leaks:', leaks)
  process.exit(1)
}
