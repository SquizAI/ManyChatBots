/**
 * KnowledgeUtils.js
 * 
 * Utility functions for searching and processing knowledge base content.
 * Provides functions to extract relevant information from various data sources.
 */

/**
 * Search documents for relevant information
 * 
 * @param {String} query - Search query
 * @param {Array} documents - Documents to search
 * @param {Object} options - Search options
 * @param {Number} options.maxResults - Maximum number of results to return
 * @param {Number} options.minScore - Minimum relevance score (0-1)
 * @returns {Array} Matching documents sorted by relevance
 */
exports.searchDocuments = (query, documents, options = {}) => {
    const maxResults = options.maxResults || 5;
    const minScore = options.minScore || 0.2;
    
    if (!query || !documents || documents.length === 0) {
        return [];
    }
    
    // Tokenize query for better matching
    const queryTerms = tokenize(query);
    
    // Calculate relevance score for each document
    const scoredDocs = documents.map(doc => {
        const score = calculateRelevance(queryTerms, doc);
        return { doc, score };
    });
    
    // Filter by minimum score and sort by relevance (descending)
    return scoredDocs
        .filter(item => item.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(item => ({
            ...item.doc,
            relevance: item.score
        }));
};

/**
 * Extract the most relevant information from a document
 * 
 * @param {String} query - Original query
 * @param {Object} document - Document to extract information from
 * @param {Object} options - Extraction options
 * @param {Number} options.maxLength - Maximum length of extracted content
 * @returns {Object} Extracted information
 */
exports.extractRelevantInfo = (query, document, options = {}) => {
    const maxLength = options.maxLength || 500;
    
    if (!document || !document.content) {
        return { excerpt: '', source: document?.source || 'Unknown' };
    }
    
    // For structured documents, combine fields
    let content = '';
    if (typeof document.content === 'string') {
        content = document.content;
    } else if (typeof document.content === 'object') {
        // Handle structured content by concatenating fields
        content = Object.values(document.content)
            .filter(val => typeof val === 'string')
            .join(' ');
    }
    
    // Find the most relevant section
    const excerpt = findMostRelevantSection(query, content, maxLength);
    
    return {
        excerpt,
        source: document.source || document.title || 'Unknown source'
    };
};

/**
 * Tokenize text into terms
 * 
 * @param {String} text - Text to tokenize
 * @returns {Array} Array of terms
 * @private
 */
function tokenize(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }
    
    // Convert to lowercase and remove punctuation
    const normalized = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    
    // Split by whitespace and filter out stop words
    const terms = normalized.split(/\s+/).filter(term => {
        return term.length > 0 && !STOP_WORDS.has(term);
    });
    
    return terms;
}

/**
 * Calculate relevance score between query terms and document
 * 
 * @param {Array} queryTerms - Tokenized query terms
 * @param {Object} document - Document to score
 * @returns {Number} Relevance score (0-1)
 * @private
 */
function calculateRelevance(queryTerms, document) {
    if (!queryTerms.length || !document) {
        return 0;
    }
    
    // Generate document content string depending on structure
    let content = '';
    
    if (typeof document.content === 'string') {
        content = document.content;
    } else if (document.content && typeof document.content === 'object') {
        content = Object.values(document.content)
            .filter(val => typeof val === 'string')
            .join(' ');
    }
    
    // Add title and tags if available for better matching
    if (document.title) {
        content = `${document.title} ${content}`;
    }
    
    if (document.tags && Array.isArray(document.tags)) {
        content = `${content} ${document.tags.join(' ')}`;
    }
    
    // Convert to lowercase for case-insensitive matching
    content = content.toLowerCase();
    
    // Calculate term frequency in document
    let matchCount = 0;
    for (const term of queryTerms) {
        // Count occurrences
        const regex = new RegExp(`\\b${term}\\b`, 'g');
        const count = (content.match(regex) || []).length;
        
        if (count > 0) {
            matchCount++;
            
            // Bonus for title matches
            if (document.title && document.title.toLowerCase().includes(term)) {
                matchCount += 0.5;
            }
            
            // Bonus for tag matches
            if (document.tags && document.tags.some(tag => tag.toLowerCase().includes(term))) {
                matchCount += 0.3;
            }
        }
    }
    
    // Final score is the percentage of query terms found in the document
    return matchCount / queryTerms.length;
}

/**
 * Find the most relevant section of text
 * 
 * @param {String} query - Search query
 * @param {String} content - Document content
 * @param {Number} maxLength - Maximum length of excerpt
 * @returns {String} Relevant excerpt
 * @private
 */
function findMostRelevantSection(query, content, maxLength) {
    if (!content) {
        return '';
    }
    
    const queryTerms = tokenize(query);
    
    // If query is empty or no terms after tokenization, return the beginning
    if (!queryTerms.length) {
        return content.substring(0, maxLength);
    }
    
    // Split content into sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (!sentences.length) {
        return content.substring(0, maxLength);
    }
    
    // Score each sentence based on query term matches
    const sentenceScores = sentences.map((sentence, index) => {
        const sentenceLower = sentence.toLowerCase();
        
        // Count term occurrences
        let score = 0;
        for (const term of queryTerms) {
            if (sentenceLower.includes(term)) {
                score++;
            }
        }
        
        // Boost score for sentences at the beginning of the document
        if (index < 3) {
            score += (3 - index) * 0.1;
        }
        
        return { sentence, score, index };
    });
    
    // Sort by score (descending)
    sentenceScores.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        // If scores are equal, prefer earlier sentences
        return a.index - b.index;
    });
    
    // Build excerpt from top-scoring sentences
    let excerpt = '';
    let usedSentences = 0;
    
    // If no sentence has a good score, use the first few sentences
    if (sentenceScores[0].score === 0) {
        excerpt = sentences.slice(0, 3).join('. ') + '.';
    } else {
        // Add the highest scoring sentences
        for (const { sentence } of sentenceScores) {
            if (excerpt.length + sentence.length > maxLength) {
                break;
            }
            
            excerpt += sentence.trim() + '. ';
            usedSentences++;
            
            // Stop after using a few sentences
            if (usedSentences >= 3) {
                break;
            }
        }
    }
    
    // Trim to max length
    if (excerpt.length > maxLength) {
        excerpt = excerpt.substring(0, maxLength - 3) + '...';
    }
    
    return excerpt;
}

// Common English stop words
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by',
    'be', 'is', 'am', 'are', 'was', 'were', 'been', 'being',
    'in', 'of', 'if', 'it', 'its', 'it\'s', 'this', 'that', 'these', 'those',
    'we', 'you', 'they', 'he', 'she', 'him', 'her', 'his', 'hers', 'their', 'our',
    'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some', 'such'
]);
