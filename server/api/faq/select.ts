import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../storage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'FAQ entry ID is required' });
    }

    const entry = await storage.getFaqEntryById(id);
    
    if (!entry) {
      return res.status(404).json({ message: 'FAQ entry not found' });
    }

    // Update usage count
    await storage.updateFaqEntryUsage(id);

    res.json({
      response: entry.answer,
      source: 'faq',
      responseTime: 0,
      faqEntryId: id
    });
  } catch (error) {
    console.error("Error selecting FAQ entry:", error);
    res.status(500).json({ message: "Failed to retrieve FAQ entry" });
  }
}