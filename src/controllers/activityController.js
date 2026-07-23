import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ipfsService from '../services/ipfsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../data/activities.json');
const ALLOWED_STATUSES = new Set(['pending', 'rejected', 'approved']);
const STATUS_ORDER = {
  pending: 0,
  rejected: 1,
  approved: 2
};

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeStatusFilter(value) {
  const normalized = normalizeStatus(value);
  if (!ALLOWED_STATUSES.has(normalized)) {
    return null;
  }
  return normalized;
}

function getActivityTimestamp(activity) {
  const timestamp = activity?.timestamp ? new Date(activity.timestamp).getTime() : NaN;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function compareActivities(a, b) {
  const statusDiff = (STATUS_ORDER[normalizeStatus(a.status)] ?? 99) - (STATUS_ORDER[normalizeStatus(b.status)] ?? 99);
  if (statusDiff !== 0) {
    return statusDiff;
  }

  return getActivityTimestamp(b) - getActivityTimestamp(a);
}

async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, '[]');
      return [];
    }
    throw error;
  }
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

async function list(req, res) {
  try {
    const activities = await readData();
    const statusFilter = normalizeStatusFilter(req.query.status);

    const filteredActivities = statusFilter
      ? activities.filter((activity) => normalizeStatus(activity.status) === statusFilter)
      : activities;

    res.json({
      ok: true,
      activities: [...filteredActivities].sort(compareActivities),
      filters: {
        status: statusFilter || null,
        availableStatuses: ['pending', 'rejected', 'approved']
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to read activities' });
  }
}

// Helper: convert a base64 data URI → { buffer, mimeType, filename }
function parseBase64Image(dataUri) {
  // Format: "data:<mimeType>;base64,<data>"
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const ext = mimeType.split('/')[1] || 'bin';
  const filename = `upload-${Date.now()}.${ext}`;
  return { buffer, mimeType, filename };
}

async function create(req, res) {
  try {
    const { category, location, quantity, evidenceHash, contributorId, organizationId, imageUrl, lat, lon, gps, volunteers, notes } = req.body;

    // Basic validation
    if (!category || !location || !quantity) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    // Upload image to Pinata IPFS if provided
    let imageCid = null;
    let imageIpfsUrl = null;
    let imageGatewayUrl = null;

    if (req.file) {
      // Multipart form-data upload
      console.log(`Uploading image "${req.file.originalname}" to Pinata...`);
      const uploaded = await ipfsService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      imageCid = uploaded.cid;
      imageIpfsUrl = uploaded.ipfsUrl;
      imageGatewayUrl = uploaded.gatewayUrl;
      console.log(`Image pinned to IPFS: ${imageGatewayUrl}`);
    } else if (imageUrl && imageUrl.startsWith('data:')) {
      // Base64 data URI sent in JSON body
      console.log('Uploading base64 image to Pinata...');
      const parsed = parseBase64Image(imageUrl);
      if (parsed) {
        const uploaded = await ipfsService.uploadFile(parsed.buffer, parsed.filename, parsed.mimeType);
        imageCid = uploaded.cid;
        imageIpfsUrl = uploaded.ipfsUrl;
        imageGatewayUrl = uploaded.gatewayUrl;
        console.log(`Image pinned to IPFS: ${imageGatewayUrl}`);
      }
    }

    const activities = await readData();
    const activity = {
      id: `activity-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category,
      location,
      quantity,
      volunteers: volunteers ? parseInt(volunteers, 10) : 0,
      evidenceHash,
      contributorId,
      organizationId,
      // IPFS image fields
      imageCid: imageCid || null,
      imageIpfsUrl: imageIpfsUrl || null,
      imageGatewayUrl: imageGatewayUrl || null,
      lat: lat || null,
      lon: lon || null,
      gps: gps || null,
      notes: notes || '',
      timestamp: req.body.timestamp || new Date().toISOString(),
      status: 'pending'
    };

    activities.push(activity);
    await writeData(activities);

    res.status(201).json({ ok: true, activity });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ ok: false, error: error.message || 'Failed to create activity' });
  }
}


async function getById(req, res) {
  try {
    const activities = await readData();
    const activity = activities.find((item) => item.id === req.params.id);
    if (!activity) {
      return res.status(404).json({ ok: false, error: 'Activity not found' });
    }
    res.json({ ok: true, activity });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to retrieve activity' });
  }
}

async function review(req, res) {
  try {
    const activities = await readData();
    const index = activities.findIndex((item) => item.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ ok: false, error: 'Activity not found' });
    }
    
    activities[index] = {
      ...activities[index],
      status: normalizeStatus(req.body.status) || 'approved',
      reviewNote: req.body.reviewNote || '',
      reviewedAt: new Date().toISOString()
    };
    
    await writeData(activities);
    res.json({ ok: true, activity: activities[index] });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to review activity' });
  }
}

async function mint(req, res) {
  try {
    const activities = await readData();
    const index = activities.findIndex((item) => item.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ ok: false, error: 'Activity not found' });
    }
    
    activities[index].reward = {
      id: `reward-${activities[index].id}`,
      txHash: `0x${Math.random().toString(16).slice(2)}`,
      amount: req.body.amount || 10,
      tokenType: req.body.tokenType || 'OCEAN',
      mintedAt: new Date().toISOString()
    };
    
    await writeData(activities);
    res.json({ ok: true, activity: activities[index] });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to mint reward' });
  }
}

export default { list, create, getById, review, mint };
