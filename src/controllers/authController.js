function login(req, res) {
  res.json({ ok: true, message: 'Wallet login placeholder', wallet: req.body.wallet || 'unknown' });
}

function verify(req, res) {
  res.json({ ok: true, message: 'Verification placeholder' });
}

export default { login, verify };
