import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../data/activities.json');

async function getStats(req, res) {
  try {
    let activities = [];
    try {
      const raw = await fs.readFile(DATA_FILE, 'utf-8');
      activities = JSON.parse(raw);
    } catch {
      activities = [];
    }

    const totalActivities   = activities.length;
    const approvedActivities = activities.filter(a => a.status === 'approved').length;
    const pendingActivities  = activities.filter(a => a.status === 'pending').length;
    const rejectedActivities = activities.filter(a => a.status === 'rejected').length;

    const totalKgCollected = activities.reduce((sum, a) => sum + (parseFloat(a.quantity) || 0), 0);

    const totalVolunteers = activities.reduce((sum, a) => sum + (parseInt(a.volunteers, 10) || 0), 0);

    const partnerOrgs = new Set(activities.map(a => a.organizationId).filter(Boolean)).size;

    // 10 impact credits per approved activity
    const impactCredits = approvedActivities * 10;

    res.json({
      ok: true,
      stats: {
        totalActivities,
        approvedActivities,
        pendingActivities,
        rejectedActivities,
        totalKgCollected,
        totalVolunteers,
        partnerOrgs,
        impactCredits
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ ok: false, error: 'Failed to compute stats' });
  }
}

export default { getStats };
