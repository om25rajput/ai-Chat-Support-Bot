import type { VercelRequest, VercelResponse } from '@vercel/node';
import { knowledgeBaseService } from '../../services/knowledgeBase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const categories = knowledgeBaseService.getCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching FAQ categories:", error);
    res.status(500).json({ message: "Failed to fetch FAQ categories" });
  }
}