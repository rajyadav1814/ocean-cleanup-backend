import { query } from '../config/connection.js';

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function mapUserRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    username: row.username,
    password: row.password_hash,
    role: row.role,
    createdAt: row.created_at
  };
}

export async function getUsers() {
  const result = await query(
    `SELECT id, first_name, last_name, email, username, password_hash, role, created_at
     FROM users
     ORDER BY created_at ASC`
  );
  return result.rows.map(mapUserRow);
}

export async function saveUsers() {
  throw new Error('saveUsers is not supported when using PostgreSQL');
}

export async function findUserByUsername(username) {
  const normalizedUsername = normalizeUsername(username);
  const result = await query(
    `SELECT id, first_name, last_name, email, username, password_hash, role, created_at
     FROM users
     WHERE LOWER(username) = $1
     LIMIT 1`,
    [normalizedUsername]
  );

  return mapUserRow(result.rows[0]);
}

export async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const result = await query(
    `SELECT id, first_name, last_name, email, username, password_hash, role, created_at
     FROM users
     WHERE LOWER(email) = $1
     LIMIT 1`,
    [normalizedEmail]
  );

  return mapUserRow(result.rows[0]);
}

export async function createUser(userData) {
  const id = Date.now().toString();
  const username = normalizeUsername(userData.username);
  const email = normalizeEmail(userData.email);

  const result = await query(
    `INSERT INTO users (id, first_name, last_name, email, username, password_hash, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, first_name, last_name, email, username, password_hash, role, created_at`,
    [
      id,
      userData.firstName,
      userData.lastName,
      email,
      username,
      userData.password,
      userData.role
    ]
  );

  return mapUserRow(result.rows[0]);
}

export async function findUserById(id) {
  const result = await query(
    `SELECT id, first_name, last_name, email, username, password_hash, role, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return mapUserRow(result.rows[0]);
}
