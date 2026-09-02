import crypto from 'crypto'
const pdfParse = require('pdf-parse')

export type PDFValidationReason =
  | 'VALID'
  | 'PDF_INVALID'
  | 'PDF_TOO_SMALL'
  | 'PDF_EMPTY'
  | 'PDF_NO_PAGES'
  | 'PDF_NO_EXTRACTABLE_CONTENT'
  | 'TEST_FIXTURE_DETECTED'
  | 'CONTENT_MISMATCHL'
  | 'PARSER_ERROR'

export interface PDFValidationOptions {
  allowTestFixtures?: boolean
  minSizeBytes?: number
  minTextLength?: number
  expectedClassId?: string
  expectedSubjectId?: string
}

export interface PDFValidationResult {
  valid: boolean
  reason: PDFValidationReason
  pageCount: number
  fileSize: number
  extractedTextLength: number
  extractedText?: string
  warnings: string[]
  sha256: string
  isTestFixture: boolean
  isScanned: boolean
}

export function calculateBufferSHA256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export async function validateTextbookPDF(
  buffer: Buffer,
  options: PDFValidationOptions = {}
): Promise<PDFValidationResult> {
  const sha256 = calculateBufferSHA256(buffer)
  const fileSize = buffer.length
  const warnings: string[] = []

  // 1. Check empty buffer
  if (!buffer || fileSize === 0) {
    return {
      valid: false,
      reason: 'PDF_EMPTY',
      pageCount: 0,
      fileSize: 0,
      extractedTextLength: 0,
      warnings: ['Buffer is empty (0 bytes).'],
      sha256,
      isTestFixture: false,
      isScanned: false,
    }
  }

  // 2. Check Magic Header (%PDF)
  const header4 = buffer.slice(0, 4).toString('utf-8')
  if (header4 !== '%PDF') {
    return {
      valid: false,
      reason: 'PDF_INVALID',
      pageCount: 0,
      fileSize,
      extractedTextLength: 0,
      warnings: [`Invalid file signature: expected %PDF, found "${header4}".`],
      sha256,
      isTestFixture: false,
      isScanned: false,
    }
  }

  // 3. Minimum FileSize Threshold
  const minBytes = options.minSizeBytes !== undefined ? options.minSizeBytes : 1000
  const isTooSmall = fileSize < minBytes
  const isTestFixture = fileSize < 1024

  // 4. PDF Parse & Text Extraction
  let extractedText = ''
  let pageCount = 1

  try {
    const parseResult = await pdfParse(buffer)
    extractedText = parseResult.text ? parseResult.text.trim() : ''
    pageCount = parseResult.numpages || 1
  } catch (err: any) {
    warnings.push(`PDF Parse warning: ${err.message}`)
    if (isTooSmall && !options.allowTestFixtures) {
      return {
        valid: false,
        reason: 'PDF_TOO_SMALL',
        pageCount: 0,
        fileSize,
        extractedTextLength: 0,
        warnings,
        sha256,
        isTestFixture: true,
        isScanned: false,
      }
    }
  }

  const extractedTextLength = extractedText.length

  // Check if test fixture
  if (isTestFixture) {
    warnings.push('File size is under 1KB; classified as test/seed fixture.')
    if (!options.allowTestFixtures) {
      return {
        valid: false,
        reason: isTooSmall ? 'PDF_TOO_SMALL' : 'TEST_FIXTURE_DETECTED',
        pageCount,
        fileSize,
        extractedTextLength,
        extractedText,
        warnings,
        sha256,
        isTestFixture: true,
        isScanned: false,
      }
    }
  }


  // 5. Scanned detection (no extractable text on multi-page PDF)
  const isScanned = pageCount > 0 && extractedTextLength < 20
  if (isScanned && !options.allowTestFixtures) {
    return {
      valid: false,
      reason: 'PDF_NO_EXTRACTABLE_CONTENT',
      pageCount,
      fileSize,
      extractedTextLength,
      extractedText,
      warnings: ['No extractable text found; PDF appears to be an un-OCRed image scan.'],
      sha256,
      isTestFixture: false,
      isScanned: true,
    }
  }

  return {
    valid: true,
    reason: 'VALID',
    pageCount,
    fileSize,
    extractedTextLength,
    extractedText,
    warnings,
    sha256,
    isTestFixture,
    isScanned,
  }
}
