# ATS Resume Scorer

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> **AI-powered resume analysis tool that helps job seekers optimize their resumes for Applicant Tracking Systems (ATS)**

Built for the UWM Data Science Club demo to showcase rapid development and deployment of a practical, production-ready web application.

## 🎯 Overview

ATS Resume Scorer analyzes resumes against job descriptions and provides:
- **Comprehensive ATS Compatibility Score** (0-100)
- **Detailed metrics** across 5 key categories
- **Keyword matching** analysis
- **Skills gap** identification
- **Actionable recommendations** for improvement
- **Downloadable PDF reports**

## ✨ Features

### Core Functionality
- 📄 **Multi-format support**: PDF, DOCX, TXT
- 🎯 **Keyword Analysis**: Identify matched and missing keywords
- 💼 **Skills Matching**: Compare technical and soft skills
- 📊 **Visual Analytics**: Interactive charts and metrics
- 💡 **Smart Recommendations**: Prioritized, actionable advice
- 📑 **PDF Export**: Download detailed reports

### Scoring Components (Total: 100 points)

| Component | Weight | Description |
|-----------|--------|-------------|
| **Keyword Match** | 40% | Matches resume keywords against job requirements |
| **Skills Alignment** | 20% | Evaluates technical and soft skills coverage |
| **Experience Relevance** | 15% | Assesses years of experience and impact |
| **Education Match** | 10% | Compares educational qualifications |
| **Format & Readability** | 15% | Checks ATS-friendly formatting |

### Analysis Capabilities

- ✅ **TF-IDF keyword extraction**
- ✅ **NLP-powered text analysis**
- ✅ **Technical skills detection** (500+ skills database)
- ✅ **Action verbs identification**
- ✅ **Quantifiable achievements detection**
- ✅ **STAR method recognition**
- ✅ **Contact information validation**
- ✅ **Industry-specific scoring**

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Local Installation

1. **Clone or download the repository**
   ```bash
   cd "Resume Scorer"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file** (optional)
   ```bash
   cp .env.example .env
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

### Using the Application

1. **Upload your resume** (PDF, DOCX, or TXT format, max 5MB)
2. **Paste the job description** or try a sample
3. **Click "Analyze Resume"**
4. **Review your score and recommendations**
5. **Export the report as PDF** (optional)

## 🌐 Deployment to Render.com

### Step 1: Prepare Your Repository

1. Create a GitHub repository (if not already done)
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: ATS Resume Scorer"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

### Step 2: Deploy to Render

1. **Sign up for Render.com** (free tier available)
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create a New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure the Service**
   ```
   Name: ats-resume-scorer (or your preferred name)
   Environment: Node
   Region: Choose nearest region
   Branch: main
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set Environment Variables** (if needed)
   ```
   PORT=3000 (Render provides this automatically)
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Your app will be live at: `https://your-app-name.onrender.com`

### Step 3: Verify Deployment

- Visit your app URL
- Test file upload
- Try sample job descriptions
- Export a PDF report

## 🏗️ Project Structure

```
ats-resume-scorer/
├── package.json              # Dependencies and scripts
├── server.js                 # Express server configuration
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── README.md                # Project documentation
│
├── services/                # Backend services
│   ├── resumeParser.js      # PDF/DOCX/TXT parsing
│   ├── keywordExtractor.js  # NLP keyword extraction
│   ├── atsScorer.js         # Scoring algorithm
│   └── reportGenerator.js   # PDF report generation
│
├── public/                  # Frontend files
│   ├── index.html          # Main HTML page
│   ├── style.css           # Styling
│   └── script.js           # Frontend JavaScript
│
└── uploads/                 # Temporary file storage (auto-created)
```

## 🔧 Technical Stack

### Backend
- **Node.js & Express** - Server framework
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction
- **mammoth** - DOCX parsing
- **natural** - NLP library for TF-IDF
- **compromise** - Advanced NLP processing
- **PDFKit** - PDF report generation

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Chart.js** - Data visualization
- **Modern CSS** - Responsive design with CSS Grid/Flexbox
- **HTML5** - Semantic markup

## 📊 Scoring Methodology

### 1. Keyword Match Score (40%)

Uses TF-IDF (Term Frequency-Inverse Document Frequency) algorithm:
- Extracts keywords from job description
- Identifies matched keywords in resume
- Calculates match rate percentage
- Bonus points for technical keyword matches

### 2. Skills Alignment Score (20%)

Compares against 500+ skill database:
- Technical skills (programming languages, frameworks)
- Tools and platforms
- Methodologies (Agile, Scrum, etc.)
- Industry-specific skills
- Bonus for extra relevant skills

### 3. Experience Relevance Score (15%)

Evaluates:
- Years of experience vs. requirements
- Presence of action verbs
- Leadership indicators
- Impact statements

### 4. Education Match Score (10%)

Compares:
- Degree level (PhD > Masters > Bachelors > Associates)
- Field of study relevance
- Certification mentions

### 5. Format & Readability Score (15%)

Checks:
- Standard section headers (Experience, Education, Skills)
- Bullet point usage
- Optimal length (400-1000 words)
- Quantifiable achievements
- ATS-friendly formatting (no special characters)

## 🎨 Design Philosophy

### Color Scheme
- **Primary**: #2563EB (Blue) - Trust, professionalism
- **Success**: #10B981 (Green) - Positive metrics
- **Warning**: #F59E0B (Amber) - Areas for improvement
- **Danger**: #EF4444 (Red) - Critical issues

### UX Principles
- **Immediate feedback** - Real-time validation
- **Progressive disclosure** - Show results step-by-step
- **Visual hierarchy** - Most important info first
- **Mobile-responsive** - Works on all devices
- **Accessibility** - Semantic HTML, color contrast

## 🔒 Security & Privacy

- **No data storage** - Files processed in memory and immediately deleted
- **No user tracking** - No analytics or cookies
- **Secure file handling** - Size limits, type validation
- **Memory efficient** - Automatic cleanup after processing

## 🚀 Performance Optimization

- **Efficient parsing** - Streaming file processing
- **Minimal dependencies** - Fast install and startup
- **Client-side validation** - Reduce server load
- **Optimized algorithms** - Fast keyword extraction
- **Lazy loading** - Charts render only when visible

## 🧪 Testing the Application

### Test Scenarios

1. **Valid Resume Upload**
   - Upload sample PDF resume
   - Use sample job description
   - Verify score calculation

2. **File Format Testing**
   - Test PDF parsing
   - Test DOCX parsing
   - Test TXT parsing

3. **Error Handling**
   - Try oversized file (>5MB)
   - Try invalid file type
   - Try empty job description

4. **Export Functionality**
   - Generate PDF report
   - Verify all sections included

## 🎓 Educational Value

This project demonstrates:
- **Full-stack development** - Frontend + Backend integration
- **Natural Language Processing** - Real-world NLP application
- **File processing** - Multi-format parsing
- **Data visualization** - Chart.js implementation
- **API design** - RESTful endpoints
- **Deployment** - Production-ready configuration

## 💡 Future Enhancements

Potential features to add:
- [ ] User accounts and history tracking
- [ ] Resume comparison (multiple versions)
- [ ] Industry-specific templates
- [ ] Integration with LinkedIn
- [ ] Cover letter analysis
- [ ] ATS system simulation
- [ ] Real-time collaborative editing
- [ ] Multi-language support
- [ ] Advanced ML scoring models
- [ ] Job board integration

## 🐛 Troubleshooting

### Common Issues

**Issue: Port already in use**
```bash
# Solution: Change port in .env or kill existing process
PORT=3001 npm start
```

**Issue: PDF parsing fails**
```bash
# Solution: Ensure file is valid PDF, not scanned image
# OCR not supported in this version
```

**Issue: Memory issues with large files**
```bash
# Solution: Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

**Issue: Module not found errors**
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📝 API Documentation

### POST `/api/analyze`

Analyze resume against job description.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `resume` (file): Resume file (PDF/DOCX/TXT, max 5MB)
  - `jobDescription` (string): Job description text
  - `industry` (string, optional): Industry type

**Response:**
```json
{
  "success": true,
  "data": {
    "overallScore": 85,
    "scoreGrade": "B",
    "scoreBreakdown": { ... },
    "metrics": { ... },
    "keywordAnalysis": { ... },
    "skillsAnalysis": { ... },
    "recommendations": [ ... ]
  }
}
```

### POST `/api/generate-report`

Generate PDF report from analysis.

**Request:**
- Content-Type: `application/json`
- Body: Complete analysis data object

**Response:**
- Content-Type: `application/pdf`
- Body: PDF file stream

### GET `/api/sample-job-descriptions`

Get sample job descriptions for demo.

**Response:**
```json
{
  "success": true,
  "samples": {
    "data-scientist": { ... },
    "software-engineer": { ... },
    "marketing-manager": { ... }
  }
}
```

## 🤝 Contributing

This is a demo project for the UWM Data Science Club. Feel free to:
- Fork the repository
- Make improvements
- Submit pull requests
- Report issues

## 📄 License

MIT License - feel free to use this project for learning and demonstration purposes.

## 👏 Acknowledgments

- **UWM Data Science Club** - Project inspiration and demo audience
- **Natural.js** - NLP capabilities
- **Chart.js** - Beautiful visualizations
- **PDFKit** - PDF generation
- **Express.js** - Solid backend framework

## 📧 Contact & Support

For questions or issues:
- Open a GitHub issue
- Contact UWM Data Science Club

---

**Built with ❤️ for the UWM Data Science Club Demo**

*Showcasing rapid development and deployment of practical AI-powered tools*
