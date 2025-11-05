/**
 * Report Generator Service
 *
 * Generates professional PDF reports of ATS analysis results.
 * Uses PDFKit to create well-formatted, downloadable reports.
 */

const PDFDocument = require('pdfkit');

/**
 * Generate PDF report from analysis data
 *
 * @param {Object} analysisData - Complete analysis results
 * @returns {Promise<Buffer>} - PDF file as buffer
 */
async function generatePDF(analysisData) {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      // Buffer to store PDF
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate report content
      generateReportContent(doc, analysisData);

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate the content of the PDF report
 *
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {Object} data - Analysis data
 */
function generateReportContent(doc, data) {
  const primaryColor = '#2563EB';
  const successColor = '#10B981';
  const warningColor = '#F59E0B';
  const dangerColor = '#EF4444';

  // Helper function to get score color
  const getScoreColor = (score) => {
    if (score >= 70) return successColor;
    if (score >= 40) return warningColor;
    return dangerColor;
  };

  // Page 1: Header and Overall Score
  doc.fontSize(24)
     .fillColor(primaryColor)
     .text('ATS Resume Score Report', { align: 'center' });

  doc.fontSize(10)
     .fillColor('#6B7280')
     .text(`Generated: ${new Date(data.timestamp).toLocaleString()}`, { align: 'center' });

  doc.moveDown(2);

  // Overall Score Box
  const scoreColor = getScoreColor(data.overallScore);
  doc.fontSize(16)
     .fillColor('#1F2937')
     .text('Overall ATS Compatibility Score', { align: 'center' });

  doc.fontSize(48)
     .fillColor(scoreColor)
     .text(`${data.overallScore}/100`, { align: 'center' });

  doc.fontSize(14)
     .fillColor('#6B7280')
     .text(`Grade: ${data.scoreGrade}`, { align: 'center' });

  doc.moveDown(2);

  // Score Breakdown Section
  doc.fontSize(18)
     .fillColor(primaryColor)
     .text('Score Breakdown');

  doc.moveDown(0.5);

  // Draw breakdown table
  const breakdownItems = [
    {
      name: 'Keyword Match',
      score: data.scoreBreakdown.keywordMatch.score,
      weight: data.scoreBreakdown.keywordMatch.weight
    },
    {
      name: 'Skills Alignment',
      score: data.scoreBreakdown.skillsAlignment.score,
      weight: data.scoreBreakdown.skillsAlignment.weight
    },
    {
      name: 'Experience Relevance',
      score: data.scoreBreakdown.experienceRelevance.score,
      weight: data.scoreBreakdown.experienceRelevance.weight
    },
    {
      name: 'Education Match',
      score: data.scoreBreakdown.educationMatch.score,
      weight: data.scoreBreakdown.educationMatch.weight
    },
    {
      name: 'Format & Readability',
      score: data.scoreBreakdown.formatReadability.score,
      weight: data.scoreBreakdown.formatReadability.weight
    }
  ];

  let yPosition = doc.y;
  breakdownItems.forEach((item, index) => {
    doc.fontSize(12)
       .fillColor('#1F2937')
       .text(item.name, 50, yPosition);

    doc.fontSize(12)
       .fillColor(getScoreColor(item.score))
       .text(`${item.score}/100`, 300, yPosition);

    doc.fontSize(10)
       .fillColor('#6B7280')
       .text(`(${item.weight}% weight)`, 380, yPosition);

    // Progress bar
    const barWidth = 150;
    const barHeight = 8;
    const barX = 300;
    const barY = yPosition + 15;

    // Background bar
    doc.rect(barX, barY, barWidth, barHeight)
       .fillColor('#E5E7EB')
       .fill();

    // Progress bar
    const progressWidth = (item.score / 100) * barWidth;
    doc.rect(barX, barY, progressWidth, barHeight)
       .fillColor(getScoreColor(item.score))
       .fill();

    yPosition += 35;
  });

  doc.moveDown(2);

  // Key Metrics Section
  doc.fontSize(18)
     .fillColor(primaryColor)
     .text('Key Metrics', 50, yPosition + 20);

  yPosition = doc.y + 10;

  const metrics = [
    { label: 'Keywords Matched', value: data.metrics.keywordsMatched },
    { label: 'Keywords Missing', value: data.metrics.keywordsMissing },
    { label: 'Match Rate', value: `${data.metrics.matchRate}%` },
    { label: 'Skills Coverage', value: `${data.metrics.skillsCoverage}%` },
    { label: 'Action Verbs Count', value: data.metrics.actionVerbsCount },
    { label: 'Quantifiable Achievements', value: data.metrics.quantifiableAchievements },
    { label: 'Resume Length (words)', value: data.metrics.resumeLength.words },
    { label: 'Estimated Pages', value: data.metrics.resumeLength.pages }
  ];

  // Display metrics in two columns
  metrics.forEach((metric, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = col === 0 ? 50 : 320;
    const y = yPosition + (row * 25);

    doc.fontSize(10)
       .fillColor('#6B7280')
       .text(metric.label, x, y);

    doc.fontSize(12)
       .fillColor('#1F2937')
       .text(String(metric.value), x + 150, y);
  });

  // New page for detailed analysis
  doc.addPage();

  // Keyword Analysis Section
  doc.fontSize(18)
     .fillColor(primaryColor)
     .text('Keyword Analysis');

  doc.moveDown(0.5);

  // Matched Keywords
  doc.fontSize(14)
     .fillColor(successColor)
     .text(`✓ Matched Keywords (${data.keywordAnalysis.matched.length})`);

  doc.fontSize(10)
     .fillColor('#1F2937');

  const matchedText = data.keywordAnalysis.matched.slice(0, 30).join(', ');
  doc.text(matchedText || 'None', { width: 500 });

  doc.moveDown(1);

  // Missing Keywords
  doc.fontSize(14)
     .fillColor(dangerColor)
     .text(`✗ Missing Keywords (${data.keywordAnalysis.missing.length})`);

  doc.fontSize(10)
     .fillColor('#1F2937');

  const missingText = data.keywordAnalysis.missing.slice(0, 30).join(', ');
  doc.text(missingText || 'None', { width: 500 });

  doc.moveDown(2);

  // Skills Analysis
  if (data.skillsAnalysis && data.skillsAnalysis.analysis) {
    doc.fontSize(18)
       .fillColor(primaryColor)
       .text('Skills Analysis');

    doc.moveDown(0.5);

    doc.fontSize(12)
       .fillColor('#1F2937')
       .text(`Total Skills Found: ${data.skillsAnalysis.analysis.totalResumeSkills}`);

    doc.text(`Skills Matched: ${data.skillsAnalysis.analysis.matched.length}`);
    doc.text(`Skills Coverage: ${data.metrics.skillsCoverage}%`);

    doc.moveDown(1);

    if (data.skillsAnalysis.analysis.matched.length > 0) {
      doc.fontSize(12)
         .fillColor(successColor)
         .text('Matched Skills:');

      doc.fontSize(10)
         .fillColor('#1F2937');

      const matchedSkills = data.skillsAnalysis.analysis.matched
        .slice(0, 20)
        .map(s => s.skill)
        .join(', ');
      doc.text(matchedSkills, { width: 500 });
    }

    doc.moveDown(1);

    if (data.skillsAnalysis.analysis.missing.length > 0) {
      doc.fontSize(12)
         .fillColor(warningColor)
         .text('Missing Skills:');

      doc.fontSize(10)
         .fillColor('#1F2937');

      const missingSkills = data.skillsAnalysis.analysis.missing
        .slice(0, 15)
        .map(s => s.skill)
        .join(', ');
      doc.text(missingSkills, { width: 500 });
    }
  }

  // New page for recommendations
  doc.addPage();

  // Recommendations Section
  doc.fontSize(18)
     .fillColor(primaryColor)
     .text('Recommendations for Improvement');

  doc.moveDown(1);

  if (data.recommendations && data.recommendations.length > 0) {
    data.recommendations.forEach((rec, index) => {
      // Priority indicator
      const priorityColor = rec.priority === 'high' ? dangerColor :
                           rec.priority === 'medium' ? warningColor :
                           successColor;

      doc.fontSize(12)
         .fillColor(priorityColor)
         .text(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);

      doc.fontSize(10)
         .fillColor('#6B7280')
         .text(`Category: ${rec.category}`);

      doc.fontSize(10)
         .fillColor('#1F2937')
         .text(rec.description, { width: 500 });

      doc.fontSize(10)
         .fillColor('#4B5563')
         .text(`Action: ${rec.action}`, { width: 500 });

      doc.moveDown(1);

      // Check if we need a new page
      if (doc.y > 700 && index < data.recommendations.length - 1) {
        doc.addPage();
      }
    });
  } else {
    doc.fontSize(12)
       .fillColor('#6B7280')
       .text('No specific recommendations - your resume looks great!');
  }

  // Footer
  doc.fontSize(8)
     .fillColor('#9CA3AF')
     .text('Generated by ATS Resume Scorer - UWM Data Science Club',
           50, 750,
           { align: 'center', width: 500 });
}

module.exports = {
  generatePDF
};
