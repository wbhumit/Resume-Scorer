/**
 * Keyword Extractor Service
 *
 * Uses Natural Language Processing to extract meaningful keywords,
 * skills, and phrases from resumes and job descriptions.
 *
 * Key features:
 * - TF-IDF based keyword extraction
 * - Technical skills detection
 * - Action verbs identification
 * - Named entity recognition
 * - Phrase extraction
 */

const natural = require('natural');
const compromise = require('compromise');

// Initialize NLP components
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

/**
 * Common technical skills database
 * Organized by category for better matching
 */
const TECHNICAL_SKILLS = {
  programming: [
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'go', 'rust',
    'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css'
  ],
  frameworks: [
    'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
    'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'react native',
    'flutter', 'next.js', 'fastapi', 'laravel', 'rails', '.net', 'asp.net'
  ],
  databases: [
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
    'dynamodb', 'oracle', 'sql server', 'sqlite', 'mariadb', 'neo4j'
  ],
  cloud: [
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'jenkins',
    'terraform', 'ansible', 'ci/cd', 'devops', 'microservices', 'serverless'
  ],
  dataScience: [
    'machine learning', 'deep learning', 'nlp', 'computer vision', 'data mining',
    'statistical analysis', 'data visualization', 'big data', 'spark', 'hadoop',
    'tableau', 'power bi', 'jupyter', 'a/b testing', 'predictive modeling'
  ],
  tools: [
    'git', 'github', 'gitlab', 'jira', 'confluence', 'slack', 'vscode',
    'intellij', 'postman', 'swagger', 'figma', 'sketch', 'photoshop'
  ],
  methodologies: [
    'agile', 'scrum', 'kanban', 'waterfall', 'tdd', 'bdd', 'ci/cd',
    'pair programming', 'code review', 'version control'
  ]
};

/**
 * Common action verbs used in resumes
 * These indicate accomplishments and responsibilities
 */
const ACTION_VERBS = [
  'achieved', 'improved', 'developed', 'created', 'implemented', 'designed',
  'managed', 'led', 'coordinated', 'increased', 'decreased', 'reduced',
  'optimized', 'streamlined', 'automated', 'launched', 'delivered', 'built',
  'established', 'analyzed', 'evaluated', 'researched', 'collaborated',
  'mentored', 'trained', 'presented', 'negotiated', 'resolved', 'executed'
];

/**
 * Stop words to filter out during keyword extraction
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
]);

/**
 * Main keyword extraction function
 * Combines multiple NLP techniques for comprehensive analysis
 *
 * @param {string} text - Input text (resume or job description)
 * @returns {Object} - Extracted keywords and metadata
 */
function extractKeywords(text) {
  if (!text || text.trim().length === 0) {
    return {
      keywords: [],
      skills: [],
      actionVerbs: [],
      phrases: [],
      entities: []
    };
  }

  const cleanText = text.toLowerCase();

  // Extract using multiple methods
  const tfidfKeywords = extractTFIDFKeywords(text);
  const skills = extractSkills(cleanText);
  const actionVerbs = extractActionVerbs(cleanText);
  const phrases = extractPhrases(text);
  const entities = extractEntities(text);

  // Combine and deduplicate all keywords
  const allKeywords = new Set([
    ...tfidfKeywords,
    ...skills.map(s => s.skill),
    ...phrases
  ]);

  return {
    keywords: Array.from(allKeywords),
    skills: skills,
    actionVerbs: actionVerbs,
    phrases: phrases,
    entities: entities,
    metadata: {
      totalKeywords: allKeywords.size,
      skillsCount: skills.length,
      actionVerbsCount: actionVerbs.length
    }
  };
}

/**
 * Extract keywords using TF-IDF algorithm
 * TF-IDF identifies important terms based on frequency and uniqueness
 *
 * @param {string} text - Input text
 * @returns {Array<string>} - Ranked keywords
 */
function extractTFIDFKeywords(text) {
  const tfidf = new TfIdf();
  tfidf.addDocument(text);

  const keywords = [];
  tfidf.listTerms(0).forEach(item => {
    // Filter out stop words and short terms
    if (!STOP_WORDS.has(item.term) && item.term.length > 2) {
      keywords.push(item.term);
    }
  });

  // Return top 50 keywords
  return keywords.slice(0, 50);
}

/**
 * Extract technical skills from text
 * Matches against comprehensive skills database
 *
 * @param {string} text - Input text (lowercase)
 * @returns {Array<Object>} - Found skills with categories
 */
function extractSkills(text) {
  const foundSkills = [];
  const processedText = ' ' + text + ' '; // Add spaces for word boundary matching

  // Search for skills in each category
  Object.keys(TECHNICAL_SKILLS).forEach(category => {
    TECHNICAL_SKILLS[category].forEach(skill => {
      // Use word boundary matching to avoid partial matches
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = processedText.match(regex);

      if (matches && matches.length > 0) {
        foundSkills.push({
          skill: skill,
          category: category,
          count: matches.length
        });
      }
    });
  });

  // Sort by count (most mentioned first)
  return foundSkills.sort((a, b) => b.count - a.count);
}

/**
 * Extract action verbs from text
 * Identifies strong action words indicating accomplishments
 *
 * @param {string} text - Input text (lowercase)
 * @returns {Array<Object>} - Found action verbs with positions
 */
function extractActionVerbs(text) {
  const foundVerbs = [];
  const sentences = text.split(/[.!?\n]+/);

  ACTION_VERBS.forEach(verb => {
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    const matches = text.match(regex);

    if (matches && matches.length > 0) {
      foundVerbs.push({
        verb: verb,
        count: matches.length
      });
    }
  });

  return foundVerbs.sort((a, b) => b.count - a.count);
}

/**
 * Extract meaningful phrases using compromise NLP
 * Identifies noun phrases, technical terms, and key phrases
 *
 * @param {string} text - Input text
 * @returns {Array<string>} - Extracted phrases
 */
function extractPhrases(text) {
  const doc = compromise(text);
  const phrases = new Set();

  // Extract noun phrases
  doc.nouns().out('array').forEach(noun => {
    if (noun.split(' ').length >= 2 && noun.length > 5) {
      phrases.add(noun.toLowerCase());
    }
  });

  // Extract multi-word technical terms
  const bigramRegex = /\b([a-z]+\s+[a-z]+)\b/gi;
  let match;
  while ((match = bigramRegex.exec(text.toLowerCase())) !== null) {
    const phrase = match[1];
    if (!STOP_WORDS.has(phrase.split(' ')[0]) && phrase.length > 5) {
      phrases.add(phrase);
    }
  }

  return Array.from(phrases).slice(0, 30);
}

/**
 * Extract named entities (organizations, titles, etc.)
 * Uses compromise for basic NER
 *
 * @param {string} text - Input text
 * @returns {Array<Object>} - Extracted entities
 */
function extractEntities(text) {
  const doc = compromise(text);
  const entities = [];

  // Extract organizations
  const orgs = doc.organizations().out('array');
  orgs.forEach(org => {
    if (org.length > 2) {
      entities.push({ type: 'organization', value: org });
    }
  });

  // Extract places
  const places = doc.places().out('array');
  places.forEach(place => {
    if (place.length > 2) {
      entities.push({ type: 'place', value: place });
    }
  });

  return entities.slice(0, 20);
}

/**
 * Compare two sets of keywords
 * Calculates match rate and identifies missing keywords
 *
 * @param {Array<string>} resumeKeywords - Keywords from resume
 * @param {Array<string>} jobKeywords - Keywords from job description
 * @returns {Object} - Match analysis
 */
function compareKeywords(resumeKeywords, jobKeywords) {
  const resumeSet = new Set(resumeKeywords.map(k => k.toLowerCase()));
  const jobSet = new Set(jobKeywords.map(k => k.toLowerCase()));

  const matched = [];
  const missing = [];

  jobKeywords.forEach(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    if (resumeSet.has(lowerKeyword)) {
      matched.push(keyword);
    } else {
      // Check for partial matches or related terms
      let found = false;
      for (let resumeKeyword of resumeSet) {
        if (resumeKeyword.includes(lowerKeyword) || lowerKeyword.includes(resumeKeyword)) {
          matched.push(keyword);
          found = true;
          break;
        }
      }
      if (!found) {
        missing.push(keyword);
      }
    }
  });

  return {
    matched: matched,
    missing: missing,
    matchRate: jobKeywords.length > 0 ? (matched.length / jobKeywords.length) * 100 : 0,
    totalJobKeywords: jobKeywords.length,
    matchedCount: matched.length,
    missingCount: missing.length
  };
}

/**
 * Extract years of experience from text
 * Looks for patterns like "5 years", "3+ years", etc.
 *
 * @param {string} text - Input text
 * @returns {number|null} - Years of experience or null
 */
function extractYearsOfExperience(text) {
  const patterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?experience/gi,
    /experience[:\s]+(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*years?\s+(?:in|with)/gi
  ];

  let maxYears = 0;

  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (let match of matches) {
      const years = parseInt(match[1]);
      if (years > maxYears) {
        maxYears = years;
      }
    }
  });

  return maxYears > 0 ? maxYears : null;
}

/**
 * Detect education level from text
 * Identifies degree types and fields of study
 *
 * @param {string} text - Input text
 * @returns {Object} - Education information
 */
function detectEducation(text) {
  const degrees = {
    phd: /ph\.?d|doctorate|doctoral/gi,
    masters: /master['']?s|m\.?s\.?|m\.?b\.?a\.?|m\.?eng/gi,
    bachelors: /bachelor['']?s|b\.?s\.?|b\.?a\.?|b\.?eng|undergraduate/gi,
    associates: /associate['']?s|a\.?s\.?|a\.?a\.?/gi
  };

  const education = {
    highestDegree: null,
    degrees: [],
    fieldOfStudy: []
  };

  const lowerText = text.toLowerCase();

  // Check for degrees (in order of highest to lowest)
  if (degrees.phd.test(text)) {
    education.highestDegree = 'phd';
    education.degrees.push('phd');
  }
  if (degrees.masters.test(text)) {
    if (!education.highestDegree) education.highestDegree = 'masters';
    education.degrees.push('masters');
  }
  if (degrees.bachelors.test(text)) {
    if (!education.highestDegree) education.highestDegree = 'bachelors';
    education.degrees.push('bachelors');
  }
  if (degrees.associates.test(text)) {
    if (!education.highestDegree) education.highestDegree = 'associates';
    education.degrees.push('associates');
  }

  // Common fields of study
  const fields = [
    'computer science', 'data science', 'engineering', 'mathematics',
    'statistics', 'business', 'marketing', 'finance', 'accounting',
    'biology', 'chemistry', 'physics', 'psychology'
  ];

  fields.forEach(field => {
    if (lowerText.includes(field)) {
      education.fieldOfStudy.push(field);
    }
  });

  return education;
}

module.exports = {
  extractKeywords,
  compareKeywords,
  extractYearsOfExperience,
  detectEducation,
  extractSkills,
  extractActionVerbs,
  TECHNICAL_SKILLS,
  ACTION_VERBS
};
