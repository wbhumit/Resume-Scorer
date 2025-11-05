/**
 * ATS Resume Scorer - Express Server
 *
 * This server handles resume uploads, parses various file formats,
 * analyzes content against job descriptions, and generates comprehensive
 * ATS compatibility scores with actionable recommendations.
 */

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

// Import custom services
const resumeParser = require('./services/resumeParser');
const keywordExtractor = require('./services/keywordExtractor');
const atsScorer = require('./services/atsScorer');
const reportGenerator = require('./services/reportGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Configuration
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Multer Configuration for File Uploads
// Stores files temporarily in memory before processing
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Please upload PDF, DOCX, or TXT files only.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Utility function to clean up uploaded files after processing
async function cleanupFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(`Cleaned up file: ${filePath}`);
  } catch (error) {
    console.error(`Error cleaning up file: ${error.message}`);
  }
}

/**
 * POST /api/analyze
 * Main endpoint for resume analysis
 *
 * Accepts:
 * - resume file (PDF, DOCX, TXT)
 * - jobDescription (text)
 * - industry (optional - for industry-specific scoring)
 *
 * Returns:
 * - Comprehensive ATS score
 * - Detailed metrics breakdown
 * - Keyword analysis
 * - Recommendations
 */
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  let filePath = null;

  try {
    // Validate inputs
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No resume file uploaded'
      });
    }

    if (!req.body.jobDescription || req.body.jobDescription.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Job description is required'
      });
    }

    filePath = req.file.path;
    const jobDescription = req.body.jobDescription;
    const industry = req.body.industry || 'general';

    console.log(`Processing resume: ${req.file.originalname}`);
    console.log(`File size: ${(req.file.size / 1024).toFixed(2)} KB`);

    // Step 1: Parse the resume file
    const resumeText = await resumeParser.parseResume(filePath, req.file.mimetype);

    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error('Unable to extract text from resume. The file may be corrupted or empty.');
    }

    console.log(`Resume parsed successfully. Length: ${resumeText.length} characters`);

    // Step 2: Extract keywords and analyze content
    const resumeKeywords = keywordExtractor.extractKeywords(resumeText);
    const jobKeywords = keywordExtractor.extractKeywords(jobDescription);

    // Step 3: Perform comprehensive ATS scoring
    const scoreResults = atsScorer.calculateScore(resumeText, jobDescription, resumeKeywords, jobKeywords, industry);

    // Step 4: Generate insights and recommendations
    const recommendations = atsScorer.generateRecommendations(scoreResults, resumeText, jobDescription);

    // Step 5: Compile final response
    const response = {
      success: true,
      data: {
        overallScore: scoreResults.overallScore,
        scoreBreakdown: scoreResults.breakdown,
        metrics: scoreResults.metrics,
        keywordAnalysis: {
          matched: scoreResults.keywordAnalysis.matched,
          missing: scoreResults.keywordAnalysis.missing,
          matchRate: scoreResults.keywordAnalysis.matchRate
        },
        skillsAnalysis: scoreResults.skillsAnalysis,
        contentQuality: scoreResults.contentQuality,
        formatAnalysis: scoreResults.formatAnalysis,
        recommendations: recommendations,
        timestamp: new Date().toISOString()
      }
    };

    // Cleanup uploaded file after processing
    await cleanupFile(filePath);

    res.json(response);

  } catch (error) {
    console.error('Analysis error:', error);

    // Cleanup file if it exists
    if (filePath) {
      await cleanupFile(filePath);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during resume analysis'
    });
  }
});

/**
 * POST /api/generate-report
 * Generates a downloadable PDF report of the analysis
 *
 * Accepts: Full analysis results object
 * Returns: PDF file stream
 */
app.post('/api/generate-report', async (req, res) => {
  try {
    const analysisData = req.body;

    if (!analysisData || !analysisData.overallScore) {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis data'
      });
    }

    // Generate PDF report
    const pdfBuffer = await reportGenerator.generatePDF(analysisData);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=ats-resume-report.pdf');
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

/**
 * GET /api/sample-job-descriptions
 * Returns sample job descriptions for demo purposes
 */
app.get('/api/sample-job-descriptions', (req, res) => {
  const samples = {
    'data-scientist': {
      title: 'Data Scientist',
      company: 'Tech Corp',
      description: `We are seeking a Data Scientist to join our growing analytics team.

Key Responsibilities:
• Develop and implement machine learning models to solve complex business problems
• Analyze large datasets using Python, SQL, and statistical methods
• Create data visualizations and dashboards using Tableau or Power BI
• Collaborate with cross-functional teams to deliver data-driven insights
• Deploy models to production environments using cloud platforms (AWS/Azure)

Required Qualifications:
• Master's degree in Data Science, Statistics, Computer Science, or related field
• 3+ years of experience in data science or analytics role
• Strong proficiency in Python (pandas, scikit-learn, TensorFlow)
• Experience with SQL and database management
• Knowledge of machine learning algorithms and statistical modeling
• Excellent communication and presentation skills

Preferred Qualifications:
• PhD in quantitative field
• Experience with deep learning frameworks (PyTorch, Keras)
• Knowledge of big data technologies (Spark, Hadoop)
• Experience with A/B testing and experimental design
• Publications or contributions to open-source projects`
    },
    'software-engineer': {
      title: 'Senior Software Engineer',
      company: 'Innovation Labs',
      description: `Join our engineering team as a Senior Software Engineer working on cutting-edge web applications.

Responsibilities:
• Design and develop scalable web applications using modern JavaScript frameworks
• Write clean, maintainable code following best practices and design patterns
• Collaborate with product managers and designers on feature development
• Conduct code reviews and mentor junior developers
• Optimize application performance and user experience
• Implement automated testing and CI/CD pipelines

Requirements:
• Bachelor's degree in Computer Science or equivalent experience
• 5+ years of professional software development experience
• Expert knowledge of JavaScript, React, Node.js
• Experience with RESTful APIs and microservices architecture
• Proficiency with Git, Docker, and cloud platforms (AWS/GCP)
• Strong problem-solving and debugging skills
• Excellent teamwork and communication abilities

Nice to Have:
• TypeScript experience
• Knowledge of GraphQL
• Experience with Kubernetes
• Contributions to open-source projects
• Agile/Scrum methodology experience`
    },
    'marketing-manager': {
      title: 'Digital Marketing Manager',
      company: 'Brand Solutions Inc',
      description: `We're looking for a creative and data-driven Digital Marketing Manager to lead our marketing initiatives.

Key Duties:
• Develop and execute comprehensive digital marketing strategies
• Manage social media campaigns across multiple platforms
• Analyze campaign performance using Google Analytics and marketing automation tools
• Create engaging content for email marketing, blogs, and social channels
• Manage SEO/SEM strategies to increase organic and paid traffic
• Collaborate with design and content teams on creative assets
• Monitor industry trends and competitor activities
• Report on KPIs and ROI to stakeholders

Qualifications:
• Bachelor's degree in Marketing, Business, or related field
• 4+ years of digital marketing experience
• Proven track record of successful campaign management
• Expertise in Google Ads, Facebook Ads, LinkedIn Marketing
• Strong analytical skills and experience with marketing analytics tools
• Excellent written and verbal communication skills
• Project management experience
• Budget management experience

Preferred:
• MBA or marketing certification
• Experience with marketing automation platforms (HubSpot, Marketo)
• Graphic design skills (Adobe Creative Suite)
• Video content creation experience`
    }
  };

  res.json({
    success: true,
    samples: samples
  });
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Root endpoint - serves the main application
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   ATS Resume Scorer - Server Running                     ║
║   Port: ${PORT}                                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                                ║
║   URL: http://localhost:${PORT}                            ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
