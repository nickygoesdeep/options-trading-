import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runEngine } from '../../apps/engine/src/scheduler/cron.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await runEngine();
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Engine failed' });
  }
}
