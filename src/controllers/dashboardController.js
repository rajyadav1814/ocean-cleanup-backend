import { getDashboardStats } from '../services/activityService.js';

async function getStats(req, res) {
  try {
    const stats = await getDashboardStats();

    res.json({
      ok: true,
      stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ ok: false, error: 'Failed to compute stats' });
  }
}

export default { getStats };
