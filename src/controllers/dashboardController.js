import { getDashboardStats } from '../services/activityService.js';
import { getUsers, setUserActiveStatus as setUserActiveStatusInService } from '../services/userService.js';

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
      .map(({ id, firstName, lastName, username, email, active, createdAt }) => ({
        id, firstName, lastName, username, email, active, createdAt
      }));
    const contributors = allUsers
      .filter((u) => u.role === 'contributor')
      .map(({ id, firstName, lastName, username, email, active, createdAt }) => ({
        id, firstName, lastName, username, email, active, createdAt
      }));

    res.json({ ok: true, verifiers, contributors });
  } catch (error) {
    console.error('Dashboard user lists error:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch user lists' });
  }
}

async function setUserActiveStatus(req, res) {
  try {
    const { id } = req.params;
    const active = req.body.active;

    if (typeof active !== 'boolean') {
      return res.status(400).json({ ok: false, error: 'Active status must be boolean' });
    }

    const updatedUser = await setUserActiveStatusInService(id, active);
    if (!updatedUser) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    res.json({ ok: true, user: updatedUser });
  } catch (error) {
    console.error('Dashboard set user active error:', error);
    res.status(500).json({ ok: false, error: 'Failed to update user status' });
  }
}

export default { getStats, getUserLists, setUserActiveStatus };
