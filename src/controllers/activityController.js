import ipfsService from '../services/ipfsService.js';
import {
  listActivities,
  createActivity,
  getActivityById,
  reviewActivity,
  mintReward,
  deleteActivity
} from '../services/activityService.js';
import { send as sendActivityNotification } from '../services/notificationService.js';

// Helper: convert a base64 data URI → { buffer, mimeType, filename }
function parseBase64Image(dataUri) {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const ext = mimeType.split('/')[1] || 'bin';
  const filename = `upload-${Date.now()}.${ext}`;
  return { buffer, mimeType, filename };
}

async function list(req, res) {
  try {
    const { activities, filters } = await listActivities(req.query.status);

    res.json({
      ok: true,
      activities,
      filters
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to read activities' });
  }
}

async function create(req, res) {
  try {
    const {
      category,
      location,
      quantity,
      evidenceHash,
      contributorId,
      organizationId,
      imageUrl,
      lat,
      lon,
      gps,
      volunteers,
      notes
    } = req.body;

    if (!category || !location || !quantity) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    let imageCid = null;
    let imageIpfsUrl = null;
    let imageGatewayUrl = null;

    if (req.file) {
      const uploaded = await ipfsService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      imageCid = uploaded.cid;
      imageIpfsUrl = uploaded.ipfsUrl;
      imageGatewayUrl = uploaded.gatewayUrl;
    } else if (imageUrl && imageUrl.startsWith('data:')) {
      const parsed = parseBase64Image(imageUrl);
      if (parsed) {
        const uploaded = await ipfsService.uploadFile(parsed.buffer, parsed.filename, parsed.mimeType);
        imageCid = uploaded.cid;
        imageIpfsUrl = uploaded.ipfsUrl;
        imageGatewayUrl = uploaded.gatewayUrl;
      }
    }

    const activity = await createActivity({
      category,
      location,
      quantity,
      evidenceHash,
      contributorId,
      organizationId,
      imageCid,
      imageIpfsUrl,
      imageGatewayUrl,
      lat,
      lon,
      gps,
      volunteers,
      notes,
      timestamp: req.body.timestamp || new Date().toISOString()
    });

    try {
      await sendActivityNotification(activity);
    } catch (notificationError) {
      console.error('Failed to send admin notification for submitted activity:', notificationError);
    }

    res.status(201).json({ ok: true, activity });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ ok: false, error: error.message || 'Failed to create activity' });
  }
}

async function getById(req, res) {
  try {
    const activity = await getActivityById(req.params.id);
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
    const activity = await reviewActivity(req.params.id, req.body.status, req.body.reviewNote || '');
    if (!activity) {
      return res.status(404).json({ ok: false, error: 'Activity not found' });
    }

    res.json({ ok: true, activity });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to review activity' });
  }
}

async function mint(req, res) {
  try {
    const activity = await mintReward(req.params.id, req.body.amount || 10, req.body.tokenType || 'OCEAN');
    if (!activity) {
      return res.status(404).json({ ok: false, error: 'Activity not found' });
    }

    res.json({ ok: true, activity });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to mint reward' });
  }
}

async function remove(req, res) {
  try {
    const deleted = await deleteActivity(req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Activity not found' });
    }

    res.json({ ok: true, message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete activity' });
  }
}

export default { list, create, getById, review, mint, remove };
