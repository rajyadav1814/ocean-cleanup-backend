import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findUserByUsername, findUserByEmail, createUser, findUserById } from '../services/userService.js';

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function signup(req, res) {
  try {
    const firstName = String(req.body.firstName || '').trim();
    const lastName = String(req.body.lastName || '').trim();
    const email = normalizeEmail(req.body.email);
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || '');
    const role = String(req.body.role || '').trim();
    const organizationId = req.body.organizationId || null;

    if (!firstName || !lastName || !email || !username || !password || !role) {
      return res.status(400).json({ ok: false, message: 'All fields are required' });
    }

    const validRoles = ['admin', 'contributor', 'verifier'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ ok: false, message: 'Invalid role' });
    }

    const [existingUserByUsername, existingUserByEmail] = await Promise.all([
      findUserByUsername(username),
      findUserByEmail(email)
    ]);

    if (existingUserByUsername) {
      return res.status(400).json({ ok: false, message: 'Username already exists' });
    }

    if (existingUserByEmail) {
      return res.status(400).json({ ok: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({ firstName, lastName, email, username, password: hashedPassword, role, organizationId });

    const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: '24h' });
    res.json({ ok: true, token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, username: user.username, role: user.role, organizationId: user.organizationId } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ ok: false, message: 'Internal server error' });
  }
}

async function login(req, res) {
  try {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || '');
    if (!username || !password) {
      return res.status(400).json({ ok: false, message: 'Username and password are required' });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    }

    if (user.active === false) {
      return res.status(403).json({ ok: false, message: 'Account is inactive' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: '24h' });
    res.json({ ok: true, token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, username: user.username, role: user.role, organizationId: user.organizationId } });
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

    res.json({ ok: true, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, username: user.username, role: user.role, organizationId: user.organizationId } });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({ ok: false, message: 'Invalid token' });
  }
}

export default { signup, login, verify };
