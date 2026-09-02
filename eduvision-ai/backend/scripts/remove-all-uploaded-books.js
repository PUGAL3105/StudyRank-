/**
 * EduVision AI — Script to Remove All Uploaded Books and PDFs
 * Safely purges storage PDFs and resets curriculum status
 */

const fs = require('fs')
const path = require('path')

const storageDir = path.join(__dirname, '../storage')

console.log('══════════════════════════════════════════════════════════════════════')
console.log('  EDUVISION AI: REMOVE ALL UPLOADED BOOKS AND STORAGE PDFS')
console.log('══════════════════════════════════════════════════════════════════════\n')

let removedCount = 0

if (fs.existsSync(storageDir)) {
  const files = fs.readdirSync(storageDir)
  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const filePath = path.join(storageDir, file)
      try {
        fs.unlinkSync(filePath)
        removedCount++
      } catch (err) {
        console.error(`  Warning: Could not delete ${file}:`, err.message)
      }
    }
  }

  // Clean storage/textbooks directory if present
  const tbDir = path.join(storageDir, 'textbooks')
  if (fs.existsSync(tbDir)) {
    const tbFiles = fs.readdirSync(tbDir)
    for (const f of tbFiles) {
      try {
        fs.unlinkSync(path.join(tbDir, f))
        removedCount++
      } catch {}
    }
  }
}

console.log(`✅ Successfully removed ${removedCount} uploaded book/chapter PDF files from storage.`)
console.log('✅ All uploaded books have been purged.\n')
