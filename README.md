# ATS Resume Scorer


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

## Troubleshooting

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
