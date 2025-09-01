// Simple embedding simulation - in production, use actual embedding models
interface EmbeddingCache {
  [key: string]: number[]
}

// Cache for embeddings to improve performance
const embeddingCache: EmbeddingCache = {}

export async function generateEmbedding(text: string): Promise<number[]> {
  // Check cache first
  if (embeddingCache[text]) {
    return embeddingCache[text]
  }

  // Enhanced text preprocessing
  const cleanText = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()

  const words = cleanText.split(" ").filter((word) => word.length > 2) // Filter short words
  const embedding = new Array(512).fill(0) // Increased dimensionality for better accuracy

  // Enhanced embedding generation with TF-IDF-like weighting
  const wordFreq: { [key: string]: number } = {}
  words.forEach((word) => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })

  for (const [word, freq] of Object.entries(wordFreq)) {
    const weight = Math.log(1 + freq) // TF-IDF style weighting
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j)
      const index1 = charCode % 512
      const index2 = (charCode * 31) % 512
      embedding[index1] += weight
      embedding[index2] += weight * 0.5
    }
  }

  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  const normalizedEmbedding = embedding.map((val) => (magnitude > 0 ? val / magnitude : 0))

  // Cache the result
  embeddingCache[text] = normalizedEmbedding
  return normalizedEmbedding
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Enhanced similarity search with multiple matching strategies
export async function findSimilarFAQ(query: string, faqDatabase: any[]) {
  const queryEmbedding = await generateEmbedding(query)
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)

  const bestMatches: Array<{ faq: any; similarity: number; matchType: string }> = []

  for (const faq of faqDatabase) {
    // Semantic similarity using embeddings
    const faqEmbedding = await generateEmbedding(faq.question + " " + faq.answer)
    const semanticSimilarity = cosineSimilarity(queryEmbedding, faqEmbedding)

    // Keyword matching score
    const faqWords = (faq.question + " " + faq.answer).toLowerCase().split(/\s+/)
    const keywordMatches = queryWords.filter((word) =>
      faqWords.some((faqWord) => faqWord.includes(word) || word.includes(faqWord)),
    ).length
    const keywordScore = keywordMatches / Math.max(queryWords.length, 1)

    // Combined score with weights
    const combinedScore = semanticSimilarity * 0.7 + keywordScore * 0.3

    if (combinedScore > 0.1) {
      // Lower threshold for better recall
      bestMatches.push({
        faq,
        similarity: combinedScore,
        matchType: semanticSimilarity > keywordScore ? "semantic" : "keyword",
      })
    }
  }

  // Sort by similarity and return top match
  bestMatches.sort((a, b) => b.similarity - a.similarity)
  return bestMatches.length > 0 ? bestMatches[0] : null
}

// New function to get multiple relevant FAQs for better context
export async function findMultipleSimilarFAQs(query: string, faqDatabase: any[], limit = 5) {
  const queryEmbedding = await generateEmbedding(query)
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)

  const matches: Array<{ faq: any; similarity: number }> = []

  for (const faq of faqDatabase) {
    const faqEmbedding = await generateEmbedding(faq.question + " " + faq.answer)
    const semanticSimilarity = cosineSimilarity(queryEmbedding, faqEmbedding)

    const faqWords = (faq.question + " " + faq.answer).toLowerCase().split(/\s+/)
    const keywordMatches = queryWords.filter((word) =>
      faqWords.some((faqWord) => faqWord.includes(word) || word.includes(faqWord)),
    ).length
    const keywordScore = keywordMatches / Math.max(queryWords.length, 1)

    const combinedScore = semanticSimilarity * 0.7 + keywordScore * 0.3

    if (combinedScore > 0.05) {
      matches.push({ faq, similarity: combinedScore })
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
}
