/**
 * Resume Parser Service
 *
 * Handles parsing of various resume formats (PDF, DOCX, TXT)
 * Extracts text content and structures it for analysis.
 *
 * Supported formats:
 * - PDF: Using pdf-parse library
 * - DOCX/DOC: Using mammoth library
 * - TXT: Direct file reading
 */

const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Main parsing function - routes to appropriate parser based on file type
 * @param {string} filePath - Path to the uploaded resume file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} - Extracted text content
 */
async function parseResume(filePath, mimeType) {
  try {
    const extension = path.extname(filePath).toLowerCase();

    console.log(`Parsing resume with extension: ${extension}, MIME type: ${mimeType}`);

    // Route to appropriate parser based on file type
    switch (extension) {
      case '.pdf':
        return await parsePDF(filePath);

      case '.docx':
      case '.doc':
        return await parseDOCX(filePath);

      case '.txt':
        return await parseTXT(filePath);

      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
}

/**
 * Parse PDF files using pdf-parse
 * Extracts text while preserving basic structure
 *
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function parsePDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(dataBuffer);

    // Clean up the extracted text
    let text = pdfData.text;

    // Remove excessive whitespace while preserving paragraph breaks
    text = text.replace(/\n{3,}/g, '\n\n'); // Reduce multiple line breaks
    text = text.replace(/[ \t]{2,}/g, ' '); // Remove multiple spaces/tabs
    text = text.trim();

    if (!text || text.length < 50) {
      throw new Error('PDF appears to be empty or contains only images');
    }

    console.log(`PDF parsed: ${pdfData.numpages} pages, ${text.length} characters`);

    return text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

/**
 * Parse DOCX/DOC files using mammoth
 * Converts to plain text while maintaining structure
 *
 * @param {string} filePath - Path to DOCX file
 * @returns {Promise<string>} - Extracted text
 */
async function parseDOCX(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    let text = result.value;

    // Clean up extracted text
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]{2,}/g, ' ');
    text = text.trim();

    if (!text || text.length < 50) {
      throw new Error('DOCX appears to be empty');
    }

    // Log any warnings from mammoth
    if (result.messages && result.messages.length > 0) {
      console.log('Mammoth warnings:', result.messages);
    }

    console.log(`DOCX parsed: ${text.length} characters`);

    return text;
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error(`Failed to parse DOCX: ${error.message}`);
  }
}

/**
 * Parse plain text files
 * Simple file reading with encoding handling
 *
 * @param {string} filePath - Path to TXT file
 * @returns {Promise<string>} - File contents
 */
async function parseTXT(filePath) {
  try {
    let text = await fs.readFile(filePath, 'utf-8');

    // Clean up text
    text = text.replace(/\r\n/g, '\n'); // Normalize line endings
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();

    if (!text || text.length < 50) {
      throw new Error('TXT file appears to be empty');
    }

    console.log(`TXT parsed: ${text.length} characters`);

    return text;
  } catch (error) {
    console.error('TXT parsing error:', error);
    throw new Error(`Failed to parse TXT: ${error.message}`);
  }
}

/**
 * Extract structured information from parsed resume text
 * This provides additional metadata for advanced analysis
 *
 * @param {string} text - Parsed resume text
 * @returns {Object} - Structured resume information
 */
function extractStructuredInfo(text) {
  const info = {
    email: null,
    phone: null,
    sections: [],
    lineCount: 0,
    wordCount: 0
  };

  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    info.email = emailMatch[0];
  }

  // Extract phone number (US format)
  const phoneRegex = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    info.phone = phoneMatch[0];
  }

  // Detect common resume sections
  const sectionHeaders = [
    'experience', 'education', 'skills', 'projects',
    'certifications', 'summary', 'objective', 'awards'
  ];

  const lowerText = text.toLowerCase();
  sectionHeaders.forEach(section => {
    if (lowerText.includes(section)) {
      info.sections.push(section);
    }
  });

  // Calculate basic metrics
  info.lineCount = text.split('\n').length;
  info.wordCount = text.split(/\s+/).length;

  return info;
}

module.exports = {
  parseResume,
  extractStructuredInfo
};
