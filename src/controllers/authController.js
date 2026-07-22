import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findUserByUsername, createUser, findUserById } from '../services/userService.js';

async function signup(req, res) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ ok: false, message: 'Username, password, and role are required' });
    }

    const validRoles = ['admin', 'contributor', 'verifier'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ ok: false, message: 'Invalid role' });
    }

    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ ok: false, message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({ username, password: hashedPassword, role });

    const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: '24h' });
    res.json({ ok: true, token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ ok: false, message: 'Internal server error' });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ ok: false, message: 'Username and password are required' });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: '24h' });
    res.json({ ok: true, token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ ok: false, message: 'Internal server error' });
  }
}

async function verify(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ ok: false, message: 'User not found' });
    }

    res.json({ ok: true, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({ ok: false, message: 'Invalid token' });
  }
}

export default { signup, login, verify };
