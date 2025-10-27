/**
 * Spam Detection for Reviews
 * Date : 27 octobre 2025
 */

export interface SpamDetectionResult {
  isSpam: boolean;
  confidence: number; // 0-1
  reasons: string[];
}

// Spam keywords (can be expanded)
const SPAM_KEYWORDS = [
  // Promotional
  'click here', 'buy now', 'limited offer', 'act now', 'free money',
  'make money', 'earn money', 'work from home', 'get paid',
  // URLs/Links
  'http://', 'https://', 'www.', '.com', '.net', '.org',
  // Cryptocurrency/Gambling
  'bitcoin', 'crypto', 'casino', 'poker', 'lottery',
  // Typical spam
  'congratulations', 'winner', 'prize', 'claim', 'verified',
  'nigerian prince', 'inheritance', 'bank account',
];

// Suspicious patterns
const SUSPICIOUS_PATTERNS = [
  /\b\d{10,}\b/g, // Long numbers (phone numbers)
  /[A-Z]{5,}/g, // ALL CAPS words
  /@[\w.]+/g, // Email addresses
  /[$€£¥₹]{3,}/g, // Multiple currency symbols
  /(!{3,})/g, // Multiple exclamation marks
  /(\?{3,})/g, // Multiple question marks
];

/**
 * Detect spam in review content
 */
export function detectSpam(content: string, title?: string): SpamDetectionResult {
  const reasons: string[] = [];
  let spamScore = 0;

  const fullText = `${title || ''} ${content}`.toLowerCase();

  // Check for spam keywords
  const keywordMatches = SPAM_KEYWORDS.filter((keyword) =>
    fullText.includes(keyword.toLowerCase())
  );

  if (keywordMatches.length > 0) {
    spamScore += keywordMatches.length * 0.2;
    reasons.push(`Contains spam keywords: ${keywordMatches.join(', ')}`);
  }

  // Check for suspicious patterns
  SUSPICIOUS_PATTERNS.forEach((pattern) => {
    const matches = fullText.match(pattern);
    if (matches && matches.length > 0) {
      spamScore += matches.length * 0.15;
      reasons.push(`Suspicious pattern detected: ${pattern.source}`);
    }
  });

  // Check for excessive capitalization
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 20) {
    spamScore += 0.3;
    reasons.push('Excessive capitalization');
  }

  // Check for very short or very long content
  if (content.length < 10) {
    spamScore += 0.2;
    reasons.push('Content too short');
  } else if (content.length > 5000) {
    spamScore += 0.2;
    reasons.push('Content suspiciously long');
  }

  // Check for repetitive content
  const words = content.split(/\s+/);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const repetitionRatio = 1 - uniqueWords.size / words.length;
  if (repetitionRatio > 0.7 && words.length > 10) {
    spamScore += 0.3;
    reasons.push('Highly repetitive content');
  }

  // Normalize score to 0-1
  const confidence = Math.min(spamScore, 1);
  const isSpam = confidence > 0.6;

  return {
    isSpam,
    confidence,
    reasons,
  };
}

/**
 * Batch spam detection for multiple reviews
 */
export function batchDetectSpam(
  reviews: Array<{ id: string; content: string; title?: string }>
): Map<string, SpamDetectionResult> {
  const results = new Map<string, SpamDetectionResult>();

  reviews.forEach((review) => {
    const result = detectSpam(review.content, review.title);
    results.set(review.id, result);
  });

  return results;
}

/**
 * Auto-flag reviews with high spam score
 */
export function shouldAutoFlag(result: SpamDetectionResult): boolean {
  return result.isSpam && result.confidence > 0.8;
}

/**
 * Get spam report summary
 */
export function getSpamReportSummary(
  results: Map<string, SpamDetectionResult>
): {
  total: number;
  spam: number;
  suspicious: number;
  clean: number;
  autoFlagged: number;
} {
  let spam = 0;
  let suspicious = 0;
  let clean = 0;
  let autoFlagged = 0;

  results.forEach((result) => {
    if (result.isSpam) {
      spam++;
      if (shouldAutoFlag(result)) {
        autoFlagged++;
      }
    } else if (result.confidence > 0.3) {
      suspicious++;
    } else {
      clean++;
    }
  });

  return {
    total: results.size,
    spam,
    suspicious,
    clean,
    autoFlagged,
  };
}

