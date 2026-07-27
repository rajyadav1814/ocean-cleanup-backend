import { getDashboardStats } from '../services/activityService.js';
import { getUsers } from '../services/userService.js';

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

async function getUserLists(req, res) {
  try {
    const allUsers = await getUsers();
    const verifiers = allUsers
      .filter((u) => u.role === 'verifier')
      .map(({ id, firstName, lastName, username, email, createdAt }) => ({
        id, firstName, lastName, username, email, createdAt
      }));
    const contributors = allUsers
      .filter((u) => u.role === 'contributor')
      .map(({ id, firstName, lastName, username, email, createdAt }) => ({
        id, firstName, lastName, username, email, createdAt
      }));

    res.json({ ok: true, verifiers, contributors });
  } catch (error) {
    console.error('Dashboard user lists error:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch user lists' });
  }
}

export default { getStats, getUserLists };
