import { FaqEntry } from "@shared/schema";

export interface SimilarityResult {
  entry: FaqEntry;
  score: number;
}

export class RAGService {
  private readonly SIMILARITY_THRESHOLD = 0.3;

  // Simplified text similarity using keyword matching and Jaccard similarity
  private calculateSimilarity(query: string, entry: FaqEntry): number {
    const queryWords = this.tokenize(query.toLowerCase());
    const questionWords = this.tokenize(entry.question.toLowerCase());
    const keywordWords = entry.keywords || [];
    
    // Combine question words and keywords for matching
    const entryWords = [...questionWords, ...keywordWords];
    
    // Calculate Jaccard similarity
    const intersection = queryWords.filter(word => entryWords.includes(word));
    const union = Array.from(new Set([...queryWords, ...entryWords]));
    
    const jaccardScore = intersection.length / union.length;
    
    // Boost score if query contains exact phrases from question
    const phraseBoost = this.calculatePhraseMatch(query.toLowerCase(), entry.question.toLowerCase());
    
    return Math.min(jaccardScore + phraseBoost, 1.0);
  }

  private tokenize(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'are', 'as', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall', 'for', 'of', 'with', 'by'];
    return stopWords.includes(word.toLowerCase());
  }

  private calculatePhraseMatch(query: string, question: string): number {
    const queryPhrases = this.extractPhrases(query);
    const questionPhrases = this.extractPhrases(question);
    
    let matches = 0;
    queryPhrases.forEach(phrase => {
      if (questionPhrases.some(qPhrase => qPhrase.includes(phrase) || phrase.includes(qPhrase))) {
        matches++;
      }
    });
    
    return matches > 0 ? 0.2 : 0;
  }

  private extractPhrases(text: string): string[] {
    const words = text.split(' ');
    const phrases: string[] = [];
    
    // Extract 2-word and 3-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(words.slice(i, i + 2).join(' '));
      if (i < words.length - 2) {
        phrases.push(words.slice(i, i + 3).join(' '));
      }
    }
    
    return phrases;
  }

  public async searchKnowledgeBase(query: string, entries: FaqEntry[]): Promise<SimilarityResult[]> {
    const startTime = Date.now();
    
    const results: SimilarityResult[] = entries
      .map(entry => ({
        entry,
        score: this.calculateSimilarity(query, entry)
      }))
      .filter(result => result.score >= this.SIMILARITY_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Return top 3 matches

    const searchTime = Date.now() - startTime;
    console.log(`RAG search completed in ${searchTime}ms, found ${results.length} matches`);
    
    return results;
  }

  public async getBestMatch(query: string, entries: FaqEntry[]): Promise<SimilarityResult | null> {
    const results = await this.searchKnowledgeBase(query, entries);
    return results.length > 0 ? results[0] : null;
  }

  public getTopMatches(query: string, entries: FaqEntry[], count: number = 3): Promise<SimilarityResult[]> {
    return this.searchKnowledgeBase(query, entries).then(results => results.slice(0, count));
  }
}

export const ragService = new RAGService();
