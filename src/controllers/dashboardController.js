function getStats(req, res) {
  res.json({
    ok: true,
    stats: {
      totalActivities: 0,
      approvedActivities: 0,
      pendingActivities: 0
    }
  });
}

export default { getStats };
