/**
 * ATS Scorer Service
 *
 * Core scoring engine that calculates comprehensive ATS compatibility metrics.
 *
 * Scoring Components (Total: 100 points):
 * - Keyword Match Score: 40%
 * - Skills Alignment Score: 20%
 * - Experience Relevance Score: 15%
 * - Education Match Score: 10%
 * - Format & ATS Readability Score: 15%
 *
 * This service provides detailed analysis and actionable recommendations
 * to help job seekers optimize their resumes for ATS systems.
 */

const natural = require('natural');
const keywordExtractor = require('./keywordExtractor');

/**
 * Main scoring function
 * Calculates overall ATS score and detailed metrics
 *
 * @param {string} resumeText - Parsed resume text
 * @param {string} jobDescription - Job description text
 * @param {Object} resumeKeywords - Extracted resume keywords
 * @param {Object} jobKeywords - Extracted job keywords
 * @param {string} industry - Industry type for specialized scoring
 * @returns {Object} - Comprehensive scoring results
 */
function calculateScore(resumeText, jobDescription, resumeKeywords, jobKeywords, industry = 'general') {
  console.log('Starting comprehensive ATS analysis...');

  // Calculate individual score components
  const keywordScore = calculateKeywordScore(resumeKeywords, jobKeywords);
  const skillsScore = calculateSkillsScore(resumeText, jobDescription);
  const experienceScore = calculateExperienceScore(resumeText, jobDescription);
  const educationScore = calculateEducationScore(resumeText, jobDescription);
  const formatScore = calculateFormatScore(resumeText);

  // Calculate weighted overall score
  const overallScore = Math.round(
    keywordScore.score * 0.40 +
    skillsScore.score * 0.20 +
    experienceScore.score * 0.15 +
    educationScore.score * 0.10 +
    formatScore.score * 0.15
  );

  // Compile detailed metrics
  const metrics = {
    keywordsMatched: keywordScore.matched,
    keywordsMissing: keywordScore.missing,
    matchRate: keywordScore.matchRate,
    skillsCoverage: skillsScore.coverage,
    criticalSkillsMatched: skillsScore.criticalMatched,
    actionVerbsCount: resumeKeywords.actionVerbs.length,
    quantifiableAchievements: countQuantifiableAchievements(resumeText),
    resumeLength: {
      words: resumeText.split(/\s+/).length,
      optimal: isOptimalLength(resumeText),
      pages: estimatePages(resumeText)
    },
    contactInfo: checkContactInfo(resumeText),
    sectionsComplete: formatScore.sections
  };

  // Compile results
  const results = {
    overallScore: overallScore,
    scoreGrade: getScoreGrade(overallScore),
    breakdown: {
      keywordMatch: {
        score: Math.round(keywordScore.score),
        weight: 40,
        weightedScore: Math.round(keywordScore.score * 0.40)
      },
      skillsAlignment: {
        score: Math.round(skillsScore.score),
        weight: 20,
        weightedScore: Math.round(skillsScore.score * 0.20)
      },
      experienceRelevance: {
        score: Math.round(experienceScore.score),
        weight: 15,
        weightedScore: Math.round(experienceScore.score * 0.15)
      },
      educationMatch: {
        score: Math.round(educationScore.score),
        weight: 10,
        weightedScore: Math.round(educationScore.score * 0.10)
      },
      formatReadability: {
        score: Math.round(formatScore.score),
        weight: 15,
        weightedScore: Math.round(formatScore.score * 0.15)
      }
    },
    metrics: metrics,
    keywordAnalysis: {
      matched: keywordScore.matchedKeywords,
      missing: keywordScore.missingKeywords,
      matchRate: keywordScore.matchRate
    },
    skillsAnalysis: skillsScore.analysis,
    contentQuality: analyzeContentQuality(resumeText),
    formatAnalysis: formatScore.analysis
  };

  console.log(`Analysis complete. Overall score: ${overallScore}/100`);
  return results;
}

/**
 * Calculate Keyword Match Score (40% of total)
 * Compares resume keywords against job description keywords
 *
 * @param {Object} resumeKeywords - Resume keyword data
 * @param {Object} jobKeywords - Job description keyword data
 * @returns {Object} - Keyword score and analysis
 */
function calculateKeywordScore(resumeKeywords, jobKeywords) {
  const comparison = keywordExtractor.compareKeywords(
    resumeKeywords.keywords,
    jobKeywords.keywords
  );

  // Calculate score based on match rate
  let score = comparison.matchRate;

  // Bonus for matching important technical terms
  const techKeywordsMatch = keywordExtractor.compareKeywords(
    resumeKeywords.skills.map(s => s.skill),
    jobKeywords.skills.map(s => s.skill)
  );

  if (techKeywordsMatch.matchRate > 70) {
    score = Math.min(100, score + 10); // Bonus for high tech match
  }

  return {
    score: score,
    matched: comparison.matchedCount,
    missing: comparison.missingCount,
    matchRate: Math.round(comparison.matchRate * 10) / 10,
    matchedKeywords: comparison.matched.slice(0, 20),
    missingKeywords: comparison.missing.slice(0, 20)
  };
}

/**
 * Calculate Skills Alignment Score (20% of total)
 * Evaluates technical and soft skills match
 *
 * @param {string} resumeText - Resume text
 * @param {string} jobDescription - Job description text
 * @returns {Object} - Skills score and analysis
 */
function calculateSkillsScore(resumeText, jobDescription) {
  const resumeSkills = keywordExtractor.extractSkills(resumeText.toLowerCase());
  const jobSkills = keywordExtractor.extractSkills(jobDescription.toLowerCase());

  if (jobSkills.length === 0) {
    return {
      score: 75, // Default score if no specific skills in job description
      coverage: 75,
      criticalMatched: 0,
      analysis: {
        matched: [],
        missing: [],
        categories: {}
      }
    };
  }

  const jobSkillNames = jobSkills.map(s => s.skill.toLowerCase());
  const resumeSkillNames = resumeSkills.map(s => s.skill.toLowerCase());

  const matchedSkills = [];
  const missingSkills = [];

  jobSkills.forEach(jobSkill => {
    if (resumeSkillNames.includes(jobSkill.skill.toLowerCase())) {
      matchedSkills.push(jobSkill);
    } else {
      missingSkills.push(jobSkill);
    }
  });

  const coverage = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) * 100 : 0;

  // Calculate score with emphasis on critical skills
  let score = coverage;

  // Bonus for having extra relevant skills
  const extraSkills = resumeSkills.length - matchedSkills.length;
  if (extraSkills > 5 && coverage > 50) {
    score = Math.min(100, score + 10);
  }

  // Categorize skills
  const categories = {};
  matchedSkills.forEach(skill => {
    categories[skill.category] = (categories[skill.category] || 0) + 1;
  });

  return {
    score: score,
    coverage: Math.round(coverage),
    criticalMatched: matchedSkills.length,
    analysis: {
      matched: matchedSkills.slice(0, 15),
      missing: missingSkills.slice(0, 10),
      categories: categories,
      totalResumeSkills: resumeSkills.length,
      totalJobSkills: jobSkills.length
    }
  };
}

/**
 * Calculate Experience Relevance Score (15% of total)
 * Evaluates years of experience and relevance
 *
 * @param {string} resumeText - Resume text
 * @param {string} jobDescription - Job description text
 * @returns {Object} - Experience score and analysis
 */
function calculateExperienceScore(resumeText, jobDescription) {
  const resumeYears = keywordExtractor.extractYearsOfExperience(resumeText);
  const jobYears = keywordExtractor.extractYearsOfExperience(jobDescription);

  let score = 70; // Base score
  let analysis = {
    resumeYears: resumeYears,
    requiredYears: jobYears,
    meetsRequirement: false,
    hasActionVerbs: false
  };

  // Compare experience if requirement is specified
  if (jobYears !== null) {
    if (resumeYears === null) {
      score = 50; // No clear experience stated
      analysis.meetsRequirement = false;
    } else if (resumeYears >= jobYears) {
      score = 100; // Meets or exceeds requirement
      analysis.meetsRequirement = true;
    } else if (resumeYears >= jobYears * 0.75) {
      score = 80; // Close to requirement
      analysis.meetsRequirement = true;
    } else {
      score = 60; // Below requirement
      analysis.meetsRequirement = false;
    }
  } else {
    // No specific requirement, score based on experience indicators
    if (resumeYears !== null && resumeYears > 0) {
      score = 85;
    }
  }

  // Check for action verbs (indicates strong experience description)
  const actionVerbs = keywordExtractor.extractActionVerbs(resumeText.toLowerCase());
  if (actionVerbs.length >= 5) {
    score = Math.min(100, score + 10);
    analysis.hasActionVerbs = true;
  }

  // Check for leadership indicators
  const leadershipTerms = ['led', 'managed', 'directed', 'supervised', 'mentored'];
  const hasLeadership = leadershipTerms.some(term =>
    resumeText.toLowerCase().includes(term)
  );

  if (hasLeadership) {
    score = Math.min(100, score + 5);
  }

  return {
    score: score,
    analysis: analysis
  };
}

/**
 * Calculate Education Match Score (10% of total)
 * Compares educational qualifications
 *
 * @param {string} resumeText - Resume text
 * @param {string} jobDescription - Job description text
 * @returns {Object} - Education score and analysis
 */
function calculateEducationScore(resumeText, jobDescription) {
  const resumeEducation = keywordExtractor.detectEducation(resumeText);
  const jobEducation = keywordExtractor.detectEducation(jobDescription);

  const degreeRank = {
    'phd': 4,
    'masters': 3,
    'bachelors': 2,
    'associates': 1
  };

  let score = 70; // Base score

  if (!jobEducation.highestDegree) {
    // No specific education requirement
    score = resumeEducation.highestDegree ? 90 : 70;
  } else {
    const resumeRank = degreeRank[resumeEducation.highestDegree] || 0;
    const jobRank = degreeRank[jobEducation.highestDegree] || 0;

    if (resumeRank >= jobRank) {
      score = 100; // Meets or exceeds requirement
    } else if (resumeRank === jobRank - 1) {
      score = 75; // One level below
    } else if (resumeRank > 0) {
      score = 60; // Has education but below requirement
    } else {
      score = 40; // No clear education
    }
  }

  // Check for field of study match
  if (jobEducation.fieldOfStudy.length > 0 && resumeEducation.fieldOfStudy.length > 0) {
    const fieldMatch = jobEducation.fieldOfStudy.some(field =>
      resumeEducation.fieldOfStudy.includes(field)
    );
    if (fieldMatch) {
      score = Math.min(100, score + 10);
    }
  }

  return {
    score: score,
    analysis: {
      resume: resumeEducation,
      required: jobEducation,
      meetsRequirement: degreeRank[resumeEducation.highestDegree] >= degreeRank[jobEducation.highestDegree]
    }
  };
}

/**
 * Calculate Format & ATS Readability Score (15% of total)
 * Evaluates resume structure and ATS-friendliness
 *
 * @param {string} resumeText - Resume text
 * @returns {Object} - Format score and analysis
 */
function calculateFormatScore(resumeText) {
  let score = 0;
  const analysis = {
    issues: [],
    strengths: []
  };

  // Check for essential sections
  const sections = {
    contact: /(email|phone|address|linkedin)/i,
    experience: /(experience|employment|work history)/i,
    education: /(education|academic|degree)/i,
    skills: /(skills|technical|competencies)/i
  };

  const foundSections = {};
  let sectionCount = 0;

  Object.keys(sections).forEach(section => {
    foundSections[section] = sections[section].test(resumeText);
    if (foundSections[section]) {
      sectionCount++;
      analysis.strengths.push(`${section.charAt(0).toUpperCase() + section.slice(1)} section present`);
    } else {
      analysis.issues.push(`Missing ${section} section`);
    }
  });

  score += (sectionCount / Object.keys(sections).length) * 40; // 40 points for sections

  // Check length (optimal: 400-800 words for 1-2 pages)
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount >= 300 && wordCount <= 1000) {
    score += 20;
    analysis.strengths.push('Optimal resume length');
  } else if (wordCount < 300) {
    score += 10;
    analysis.issues.push('Resume may be too short');
  } else {
    score += 15;
    analysis.issues.push('Resume may be too long');
  }

  // Check for bullet points (indicated by line breaks and dashes/bullets)
  const bulletPointCount = (resumeText.match(/\n[\s]*[-•*]/g) || []).length;
  if (bulletPointCount >= 5) {
    score += 15;
    analysis.strengths.push('Good use of bullet points');
  } else {
    score += 5;
    analysis.issues.push('Consider adding more bullet points');
  }

  // Check for quantifiable achievements (numbers)
  const numberCount = (resumeText.match(/\d+[%$]?/g) || []).length;
  if (numberCount >= 5) {
    score += 15;
    analysis.strengths.push('Contains quantifiable achievements');
  } else {
    score += 5;
    analysis.issues.push('Add more quantifiable results');
  }

  // Check for special characters that might confuse ATS
  const specialChars = /[™®©♦●◆▪]/g;
  if (specialChars.test(resumeText)) {
    score -= 10;
    analysis.issues.push('Contains special characters that may confuse ATS');
  } else {
    analysis.strengths.push('No problematic special characters');
    score += 10;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    sections: foundSections,
    analysis: analysis
  };
}

/**
 * Count quantifiable achievements in resume
 * Looks for numbers, percentages, dollar amounts
 *
 * @param {string} text - Resume text
 * @returns {number} - Count of quantifiable achievements
 */
function countQuantifiableAchievements(text) {
  const patterns = [
    /\d+%/g, // Percentages
    /\$[\d,]+/g, // Dollar amounts
    /\d+[\s]*(million|thousand|billion)/gi, // Large numbers
    /increased|decreased|improved|reduced[\s\w]*by[\s]*\d+/gi, // Achievement patterns
    /\d+[\s]*(years|months|weeks|days)/gi // Time periods
  ];

  let count = 0;
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  });

  return count;
}

/**
 * Analyze content quality
 * Evaluates writing style, readability, and professional tone
 *
 * @param {string} text - Resume text
 * @returns {Object} - Content quality metrics
 */
function analyzeContentQuality(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/);

  // Calculate average sentence length
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;

  // Check for active voice (presence of action verbs at sentence starts)
  const actionVerbs = keywordExtractor.extractActionVerbs(text.toLowerCase());
  const activeVoiceRatio = sentences.length > 0 ? (actionVerbs.length / sentences.length) * 100 : 0;

  // Detect STAR method usage (Situation, Task, Action, Result)
  const starIndicators = [
    /achieved|accomplished|attained/gi,
    /resulted in|led to|contributed to/gi,
    /responsible for|tasked with/gi,
    /implemented|executed|delivered/gi
  ];

  let starCount = 0;
  starIndicators.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) starCount += matches.length;
  });

  const usesSTAR = starCount >= 3;

  return {
    avgSentenceLength: Math.round(avgSentenceLength),
    activeVoiceRatio: Math.round(activeVoiceRatio),
    usesSTARMethod: usesSTAR,
    starIndicatorCount: starCount,
    readabilityScore: calculateReadabilityScore(avgSentenceLength, activeVoiceRatio),
    wordCount: words.length,
    sentenceCount: sentences.length
  };
}

/**
 * Calculate readability score
 * Based on sentence length and active voice usage
 *
 * @param {number} avgSentenceLength - Average sentence length
 * @param {number} activeVoiceRatio - Percentage of active voice
 * @returns {number} - Readability score (0-100)
 */
function calculateReadabilityScore(avgSentenceLength, activeVoiceRatio) {
  let score = 100;

  // Penalize very long sentences (optimal: 15-20 words)
  if (avgSentenceLength > 25) {
    score -= 20;
  } else if (avgSentenceLength > 20) {
    score -= 10;
  }

  // Penalize very short sentences
  if (avgSentenceLength < 10) {
    score -= 15;
  }

  // Reward active voice
  if (activeVoiceRatio > 50) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Check for complete contact information
 *
 * @param {string} text - Resume text
 * @returns {Object} - Contact information completeness
 */
function checkContactInfo(text) {
  return {
    hasEmail: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text),
    hasPhone: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text),
    hasLinkedIn: /linkedin\.com/i.test(text),
    hasLocation: /(city|state|address|location)/i.test(text)
  };
}

/**
 * Check if resume length is optimal
 *
 * @param {string} text - Resume text
 * @returns {boolean} - Whether length is optimal
 */
function isOptimalLength(text) {
  const wordCount = text.split(/\s+/).length;
  return wordCount >= 300 && wordCount <= 1000;
}

/**
 * Estimate number of pages
 *
 * @param {string} text - Resume text
 * @returns {number} - Estimated pages
 */
function estimatePages(text) {
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / 500); // Roughly 500 words per page
}

/**
 * Get score grade (letter grade)
 *
 * @param {number} score - Overall score
 * @returns {string} - Letter grade
 */
function getScoreGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Generate actionable recommendations
 * Provides specific advice based on scoring results
 *
 * @param {Object} scoreResults - Scoring results
 * @param {string} resumeText - Resume text
 * @param {string} jobDescription - Job description
 * @returns {Array<Object>} - Prioritized recommendations
 */
function generateRecommendations(scoreResults, resumeText, jobDescription) {
  const recommendations = [];

  // Keyword recommendations
  if (scoreResults.breakdown.keywordMatch.score < 70) {
    const missingKeywords = scoreResults.keywordAnalysis.missing.slice(0, 10);
    recommendations.push({
      priority: 'high',
      category: 'Keywords',
      title: 'Improve Keyword Match',
      description: `Your resume matches only ${Math.round(scoreResults.keywordAnalysis.matchRate)}% of job keywords. Add these important keywords: ${missingKeywords.slice(0, 5).join(', ')}`,
      action: 'Naturally incorporate missing keywords into your experience and skills sections'
    });
  }

  // Skills recommendations
  if (scoreResults.breakdown.skillsAlignment.score < 70) {
    if (scoreResults.skillsAnalysis && scoreResults.skillsAnalysis.analysis && scoreResults.skillsAnalysis.analysis.missing) {
      const missingSkills = scoreResults.skillsAnalysis.analysis.missing.slice(0, 5);
      if (missingSkills.length > 0) {
        recommendations.push({
          priority: 'high',
          category: 'Skills',
          title: 'Add Missing Technical Skills',
          description: `Job requires skills you haven't listed: ${missingSkills.map(s => s.skill).join(', ')}`,
          action: 'Add a dedicated skills section or incorporate these skills into your experience descriptions'
        });
      }
    }
  }

  // Experience recommendations
  if (scoreResults.metrics.actionVerbsCount < 5) {
    recommendations.push({
      priority: 'medium',
      category: 'Experience',
      title: 'Use More Action Verbs',
      description: `Your resume has only ${scoreResults.metrics.actionVerbsCount} action verbs. Strong resumes use action verbs to start bullet points.`,
      action: 'Start experience bullet points with verbs like: Developed, Implemented, Led, Achieved, Optimized'
    });
  }

  // Quantifiable achievements
  if (scoreResults.metrics.quantifiableAchievements < 3) {
    recommendations.push({
      priority: 'high',
      category: 'Impact',
      title: 'Add Quantifiable Results',
      description: 'Your resume lacks measurable achievements. Numbers make your impact concrete.',
      action: 'Add metrics: "Increased sales by 30%", "Managed team of 5", "Reduced costs by $50K"'
    });
  }

  // Format recommendations
  if (scoreResults.breakdown.formatReadability.score < 70) {
    if (scoreResults.formatAnalysis && scoreResults.formatAnalysis.analysis && scoreResults.formatAnalysis.analysis.issues) {
      const issues = scoreResults.formatAnalysis.analysis.issues;
      if (issues.length > 0) {
        recommendations.push({
          priority: 'medium',
          category: 'Format',
          title: 'Improve ATS Readability',
          description: issues.join('; '),
          action: 'Use standard section headers, add bullet points, and ensure all sections are present'
        });
      }
    }
  }

  // Length recommendations
  if (!scoreResults.metrics.resumeLength.optimal) {
    if (scoreResults.metrics.resumeLength.words < 300) {
      recommendations.push({
        priority: 'medium',
        category: 'Length',
        title: 'Expand Your Resume',
        description: 'Your resume is too brief. Add more detail about your experiences and achievements.',
        action: 'Aim for 400-800 words (1-2 pages). Add more bullet points to each role.'
      });
    } else {
      recommendations.push({
        priority: 'low',
        category: 'Length',
        title: 'Consider Condensing',
        description: 'Your resume is quite long. Focus on most relevant and recent experiences.',
        action: 'Aim for 1-2 pages. Remove older or less relevant experiences.'
      });
    }
  }

  // Contact info recommendations
  if (scoreResults.metrics && scoreResults.metrics.contactInfo) {
    const contact = scoreResults.metrics.contactInfo;
    const missingContact = [];
    if (!contact.hasEmail) missingContact.push('email');
    if (!contact.hasPhone) missingContact.push('phone');
    if (!contact.hasLinkedIn) missingContact.push('LinkedIn');

    if (missingContact.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Contact',
        title: 'Complete Contact Information',
        description: `Missing: ${missingContact.join(', ')}`,
        action: 'Add all contact methods at the top of your resume'
      });
    }
  }

  // Education recommendations
  if (scoreResults.breakdown.educationMatch.score < 70) {
    recommendations.push({
      priority: 'medium',
      category: 'Education',
      title: 'Highlight Education',
      description: 'Ensure your education section clearly states your degree and field of study',
      action: 'Use clear format: "Bachelor of Science in Computer Science, University Name, Year"'
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

module.exports = {
  calculateScore,
  generateRecommendations
};
