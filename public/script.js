/**
 * ATS Resume Scorer - Frontend JavaScript
 * Handles file uploads, API calls, data visualization, and user interactions
 */

// ===== Global State =====
let selectedFile = null;
let currentAnalysis = null;
let sampleJobDescriptions = null;

// ===== DOM Elements =====
const fileUploadArea = document.getElementById('fileUploadArea');
const resumeFileInput = document.getElementById('resumeFile');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const removeFileBtn = document.getElementById('removeFileBtn');
const jobDescriptionInput = document.getElementById('jobDescription');
const analyzeBtn = document.getElementById('analyzeBtn');
const errorMessage = document.getElementById('errorMessage');
const resultsSection = document.getElementById('resultsSection');
const exportBtn = document.getElementById('exportBtn');
const analyzeAnotherBtn = document.getElementById('analyzeAnotherBtn');

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadSampleJobDescriptions();
});

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // File upload events
    fileUploadArea.addEventListener('click', () => resumeFileInput.click());
    resumeFileInput.addEventListener('change', handleFileSelect);
    removeFileBtn.addEventListener('click', removeFile);

    // Drag and drop events
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
    fileUploadArea.addEventListener('drop', handleFileDrop);

    // Job description input
    jobDescriptionInput.addEventListener('input', validateInputs);

    // Sample job buttons
    document.querySelectorAll('.sample-btn').forEach(btn => {
        btn.addEventListener('click', (e) => loadSampleJob(e.target.dataset.sample));
    });

    // Analysis button
    analyzeBtn.addEventListener('click', analyzeResume);

    // Export button
    exportBtn.addEventListener('click', exportReport);

    // Analyze another button
    analyzeAnotherBtn.addEventListener('click', resetForm);
}

/**
 * Load sample job descriptions from API
 */
async function loadSampleJobDescriptions() {
    try {
        const response = await fetch('/api/sample-job-descriptions');
        const data = await response.json();
        if (data.success) {
            sampleJobDescriptions = data.samples;
        }
    } catch (error) {
        console.error('Error loading sample jobs:', error);
    }
}

/**
 * Load a sample job description
 */
function loadSampleJob(sampleKey) {
    if (sampleJobDescriptions && sampleJobDescriptions[sampleKey]) {
        const sample = sampleJobDescriptions[sampleKey];
        jobDescriptionInput.value = sample.description;
        validateInputs();

        // Visual feedback
        document.querySelectorAll('.sample-btn').forEach(btn => {
            btn.style.background = '';
            btn.style.color = '';
        });
        event.target.style.background = 'var(--primary)';
        event.target.style.color = 'white';
    }
}

// ===== File Handling =====

/**
 * Handle file selection via input
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

/**
 * Handle drag over event
 */
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    fileUploadArea.classList.add('dragover');
}

/**
 * Handle drag leave event
 */
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    fileUploadArea.classList.remove('dragover');
}

/**
 * Handle file drop event
 */
function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    fileUploadArea.classList.remove('dragover');

    const file = event.dataTransfer.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

/**
 * Validate and set the selected file
 */
function validateAndSetFile(file) {
    // Check file type
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
        showError('Invalid file type. Please upload a PDF, DOCX, or TXT file.');
        return;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        showError('File is too large. Maximum size is 5MB.');
        return;
    }

    // Set file
    selectedFile = file;
    fileName.textContent = file.name;
    fileUploadArea.style.display = 'none';
    fileInfo.style.display = 'flex';

    hideError();
    validateInputs();
}

/**
 * Remove selected file
 */
function removeFile() {
    selectedFile = null;
    resumeFileInput.value = '';
    fileUploadArea.style.display = 'flex';
    fileInfo.style.display = 'none';
    validateInputs();
}

/**
 * Validate inputs and enable/disable analyze button
 */
function validateInputs() {
    const hasFile = selectedFile !== null;
    const hasJobDescription = jobDescriptionInput.value.trim().length > 0;

    analyzeBtn.disabled = !(hasFile && hasJobDescription);
}

// ===== Analysis =====

/**
 * Analyze resume against job description
 */
async function analyzeResume() {
    if (!selectedFile || !jobDescriptionInput.value.trim()) {
        showError('Please upload a resume and paste a job description.');
        return;
    }

    // Show loading state
    const btnText = analyzeBtn.querySelector('.btn-text');
    const btnLoader = analyzeBtn.querySelector('.btn-loader');
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    analyzeBtn.disabled = true;
    hideError();

    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
        // Prepare form data
        const formData = new FormData();
        formData.append('resume', selectedFile);
        formData.append('jobDescription', jobDescriptionInput.value.trim());

        // Make API request
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Analysis failed');
        }

        if (data.success) {
            currentAnalysis = data.data;
            displayResults(data.data);

            // Scroll to results
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        } else {
            throw new Error(data.error || 'Analysis failed');
        }

    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message || 'An error occurred during analysis. Please try again.');
    } finally {
        // Reset button state
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        analyzeBtn.disabled = false;
    }
}

/**
 * Display analysis results
 */
function displayResults(data) {
    // Show results section
    resultsSection.style.display = 'block';

    // Display overall score
    displayOverallScore(data.overallScore, data.scoreGrade);

    // Display score breakdown
    displayScoreBreakdown(data.scoreBreakdown);

    // Display metrics
    displayMetrics(data.metrics);

    // Display keyword analysis
    displayKeywordAnalysis(data.keywordAnalysis);

    // Display skills analysis
    displaySkillsAnalysis(data.skillsAnalysis);

    // Display recommendations
    displayRecommendations(data.recommendations);
}

/**
 * Display overall score with circular chart
 */
function displayOverallScore(score, grade) {
    // Update score number
    document.getElementById('overallScore').textContent = score;

    // Update grade
    const gradeElement = document.getElementById('scoreGrade');
    gradeElement.querySelector('.grade-value').textContent = grade;

    // Update status text
    const statusElement = document.getElementById('scoreStatus');
    let statusText = '';
    let statusColor = '';

    if (score >= 80) {
        statusText = 'Excellent! Your resume is well-optimized for ATS systems.';
        statusColor = 'var(--success)';
    } else if (score >= 70) {
        statusText = 'Good! Your resume is ATS-friendly with room for improvement.';
        statusColor = 'var(--success)';
    } else if (score >= 50) {
        statusText = 'Fair. Consider implementing the recommendations below.';
        statusColor = 'var(--warning)';
    } else {
        statusText = 'Needs Work. Your resume requires significant improvements for ATS.';
        statusColor = 'var(--danger)';
    }

    statusElement.querySelector('.status-text').textContent = statusText;
    statusElement.querySelector('.status-text').style.color = statusColor;

    // Create circular progress chart
    const ctx = document.getElementById('scoreChart').getContext('2d');

    // Destroy existing chart if it exists
    if (window.scoreChartInstance) {
        window.scoreChartInstance.destroy();
    }

    const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';

    window.scoreChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [color, '#E5E7EB'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}

/**
 * Display score breakdown bar chart
 */
function displayScoreBreakdown(breakdown) {
    const ctx = document.getElementById('breakdownChart').getContext('2d');

    // Destroy existing chart if it exists
    if (window.breakdownChartInstance) {
        window.breakdownChartInstance.destroy();
    }

    const labels = [
        'Keyword Match\n(40%)',
        'Skills Alignment\n(20%)',
        'Experience\n(15%)',
        'Education\n(10%)',
        'Format\n(15%)'
    ];

    const scores = [
        breakdown.keywordMatch.score,
        breakdown.skillsAlignment.score,
        breakdown.experienceRelevance.score,
        breakdown.educationMatch.score,
        breakdown.formatReadability.score
    ];

    // Color code based on score
    const colors = scores.map(score => {
        if (score >= 70) return '#10B981';
        if (score >= 40) return '#F59E0B';
        return '#EF4444';
    });

    window.breakdownChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Score',
                data: scores,
                backgroundColor: colors,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Score: ' + context.parsed.y + '/100';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Display metrics cards
 */
function displayMetrics(metrics) {
    const metricsGrid = document.getElementById('metricsGrid');
    metricsGrid.innerHTML = '';

    const metricItems = [
        { label: 'Keywords Matched', value: metrics.keywordsMatched },
        { label: 'Keywords Missing', value: metrics.keywordsMissing },
        { label: 'Match Rate', value: `${metrics.matchRate}%` },
        { label: 'Skills Coverage', value: `${metrics.skillsCoverage}%` },
        { label: 'Action Verbs', value: metrics.actionVerbsCount },
        { label: 'Quantifiable Results', value: metrics.quantifiableAchievements },
        { label: 'Word Count', value: metrics.resumeLength.words },
        { label: 'Estimated Pages', value: metrics.resumeLength.pages }
    ];

    metricItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'metric-card';
        card.innerHTML = `
            <div class="metric-label">${item.label}</div>
            <div class="metric-value">${item.value}</div>
        `;
        metricsGrid.appendChild(card);
    });
}

/**
 * Display keyword analysis
 */
function displayKeywordAnalysis(keywordAnalysis) {
    // Matched keywords
    const matchedCount = document.getElementById('matchedCount');
    const matchedKeywords = document.getElementById('matchedKeywords');

    matchedCount.textContent = keywordAnalysis.matched.length;
    matchedKeywords.innerHTML = '';

    keywordAnalysis.matched.slice(0, 30).forEach(keyword => {
        const tag = document.createElement('span');
        tag.className = 'keyword-tag';
        tag.textContent = keyword;
        matchedKeywords.appendChild(tag);
    });

    if (keywordAnalysis.matched.length === 0) {
        matchedKeywords.innerHTML = '<p style="color: var(--gray-500);">No matched keywords found</p>';
    }

    // Missing keywords
    const missingCount = document.getElementById('missingCount');
    const missingKeywords = document.getElementById('missingKeywords');

    missingCount.textContent = keywordAnalysis.missing.length;
    missingKeywords.innerHTML = '';

    keywordAnalysis.missing.slice(0, 30).forEach(keyword => {
        const tag = document.createElement('span');
        tag.className = 'keyword-tag';
        tag.textContent = keyword;
        missingKeywords.appendChild(tag);
    });

    if (keywordAnalysis.missing.length === 0) {
        missingKeywords.innerHTML = '<p style="color: var(--gray-500);">Great! All important keywords are present</p>';
    }
}

/**
 * Display skills analysis
 */
function displaySkillsAnalysis(skillsAnalysis) {
    const skillsContent = document.getElementById('skillsContent');
    skillsContent.innerHTML = '';

    // Skills statistics
    const stats = document.createElement('div');
    stats.innerHTML = `
        <div class="skills-stat">
            <div class="skills-stat-label">Skills Coverage</div>
            <div class="skills-stat-value">${skillsAnalysis.coverage}%</div>
        </div>
    `;
    skillsContent.appendChild(stats);

    // Matched skills
    if (skillsAnalysis.analysis.matched && skillsAnalysis.analysis.matched.length > 0) {
        const matchedSection = document.createElement('div');
        matchedSection.innerHTML = '<h4 style="margin: 1rem 0 0.5rem; color: var(--success);">✓ Matched Skills</h4>';
        const matchedList = document.createElement('div');
        matchedList.className = 'skills-list';

        skillsAnalysis.analysis.matched.slice(0, 20).forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.textContent = skill.skill;
            matchedList.appendChild(tag);
        });

        matchedSection.appendChild(matchedList);
        skillsContent.appendChild(matchedSection);
    }

    // Missing skills
    if (skillsAnalysis.analysis.missing && skillsAnalysis.analysis.missing.length > 0) {
        const missingSection = document.createElement('div');
        missingSection.innerHTML = '<h4 style="margin: 1rem 0 0.5rem; color: var(--warning);">✗ Missing Skills</h4>';
        const missingList = document.createElement('div');
        missingList.className = 'skills-list';

        skillsAnalysis.analysis.missing.slice(0, 15).forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag missing';
            tag.textContent = skill.skill;
            missingList.appendChild(tag);
        });

        missingSection.appendChild(missingList);
        skillsContent.appendChild(missingSection);
    }
}

/**
 * Display recommendations
 */
function displayRecommendations(recommendations) {
    const recommendationsList = document.getElementById('recommendationsList');
    recommendationsList.innerHTML = '';

    if (!recommendations || recommendations.length === 0) {
        recommendationsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--gray-500);">
                <p style="font-size: 1.125rem;">🎉 Excellent! Your resume looks great.</p>
                <p>No specific recommendations at this time.</p>
            </div>
        `;
        return;
    }

    recommendations.forEach((rec, index) => {
        const card = document.createElement('div');
        card.className = `recommendation-card priority-${rec.priority}`;
        card.innerHTML = `
            <div class="recommendation-header">
                <span class="priority-badge ${rec.priority}">${rec.priority}</span>
                <span class="recommendation-title">${rec.title}</span>
            </div>
            <div class="recommendation-category">Category: ${rec.category}</div>
            <p class="recommendation-description">${rec.description}</p>
            <div class="recommendation-action"><strong>Action:</strong> ${rec.action}</div>
        `;
        recommendationsList.appendChild(card);
    });
}

// ===== Export =====

/**
 * Export analysis report as PDF
 */
async function exportReport() {
    if (!currentAnalysis) {
        showError('No analysis data to export');
        return;
    }

    try {
        exportBtn.disabled = true;
        exportBtn.textContent = 'Generating PDF...';

        const response = await fetch('/api/generate-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentAnalysis)
        });

        if (!response.ok) {
            throw new Error('Failed to generate report');
        }

        // Download the PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ats-resume-report.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (error) {
        console.error('Export error:', error);
        showError('Failed to export report. Please try again.');
    } finally {
        exportBtn.disabled = false;
        exportBtn.innerHTML = `
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Export Report as PDF
        `;
    }
}

// ===== Utilities =====

/**
 * Show error message
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hide error message
 */
function hideError() {
    errorMessage.style.display = 'none';
}

/**
 * Reset form for new analysis
 */
function resetForm() {
    // Reset file
    removeFile();

    // Reset job description
    jobDescriptionInput.value = '';

    // Reset sample buttons
    document.querySelectorAll('.sample-btn').forEach(btn => {
        btn.style.background = '';
        btn.style.color = '';
    });

    // Hide results
    resultsSection.style.display = 'none';

    // Clear current analysis
    currentAnalysis = null;

    // Scroll to top
    window.scrollTo({ behavior: 'smooth', top: 0 });

    // Validate inputs
    validateInputs();
}
