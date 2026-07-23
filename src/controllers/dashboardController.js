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

    const totalActivities = activities.length;
    const approvedActivities = activities.filter((a) => a.status === 'approved').length;
    const pendingActivities = activities.filter((a) => a.status === 'pending').length;
    const rejectedActivities = activities.filter((a) => a.status === 'rejected').length;

    const totalKgCollected = activities.reduce((sum, a) => sum + (Number.parseFloat(a.quantity) || 0), 0);
    const approvedKgCollected = activities
      .filter((a) => a.status === 'approved')
      .reduce((sum, a) => sum + (Number.parseFloat(a.quantity) || 0), 0);

    const totalVolunteers = activities.reduce((sum, a) => sum + (Number.parseInt(a.volunteers, 10) || 0), 0);
    const partnerOrgs = new Set(activities.map((a) => a.organizationId).filter(Boolean)).size;

    const latestActivityAt = activities.reduce((latest, activity) => {
      const timestamp = activity.timestamp ? new Date(activity.timestamp).getTime() : NaN;
      if (Number.isNaN(timestamp)) {
        return latest;
      }
      return Math.max(latest, timestamp);
    }, 0);

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentActivities = activities.filter((activity) => {
      const timestamp = activity.timestamp ? new Date(activity.timestamp).getTime() : NaN;
      return !Number.isNaN(timestamp) && timestamp >= thirtyDaysAgo;
    }).length;

    // 10 impact credits per approved activity
    const impactCredits = approvedActivities * 10;
    const approvalRate = totalActivities > 0 ? Math.round((approvedActivities / totalActivities) * 100) : 0;
    const averageKgPerApprovedActivity = approvedActivities > 0
      ? Number((approvedKgCollected / approvedActivities).toFixed(1))
      : 0;

    res.json({
      ok: true,
      stats: {
        totalActivities,
        approvedActivities,
        pendingActivities,
        rejectedActivities,
        totalKgCollected,
        approvedKgCollected,
        totalVolunteers,
        partnerOrgs,
        impactCredits,
        approvalRate,
        averageKgPerApprovedActivity,
        recentActivities,
        latestActivityAt: latestActivityAt ? new Date(latestActivityAt).toISOString() : null
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ ok: false, error: 'Failed to compute stats' });
  }
}

export default { getStats };
