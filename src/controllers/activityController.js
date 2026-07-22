import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../data/activities.json');

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
    res.json({ ok: true, activities });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to read activities' });
  }
}

  async function create(req, res) {
  try {
    const { category, location, quantity, evidenceHash, contributorId, organizationId, imageUrl } = req.body;
    
    // Basic validation
    if (!category || !location || !quantity) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const activities = await readData();
    const activity = {
      id: `activity-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category,
      location,
      quantity,
      evidenceHash,
      contributorId,
      organizationId,
      imageUrl: imageUrl || null,
      notes: req.body.notes || '',
      timestamp: req.body.timestamp || new Date().toISOString(),
      status: 'pending'
    };
    
    activities.push(activity);
    await writeData(activities);
    
    res.status(201).json({ ok: true, activity });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to create activity' });
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
      status: req.body.status || 'approved',
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
