import { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('[API] Getting user by ID:', req.query.id);
    const { id } = req.query;
    const user = await storage.getUser(id as string);
    
    if (!user) {
      console.log('[API] User not found in backend storage:', id);
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log('[API] User found in backend:', user.email, user.role);
    res.json(user);
  } catch (error) {
    console.error("[API] Error fetching user from storage:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
}