import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  upsertEnquiryRecord,
  listEnquiriesFromDb,
} from './src/db/users.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOTSTRAPPED_ADMIN_EMAIL = 'sandeepssreddy54@gmail.com';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/enquiries', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || '';
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized user session' });
      }
      await getOrCreateUser(uid, email);
      const isAdminUser = email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
      const rows = await listEnquiriesFromDb(uid, isAdminUser);
      return res.json({ enquiries: rows });
    } catch (error: unknown) {
      console.error('Failed to fetch enquiries:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch enquiries';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/enquiries', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || '';
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized user session' });
      }
      await getOrCreateUser(uid, email);

      const body = req.body || {};
      const saved = await upsertEnquiryRecord({
        docId: String(body.id || `enq_${Date.now()}`),
        referenceNumber: String(body.referenceNumber || ''),
        userUid: uid,
        requirementType: String(body.requirementType || 'Accommodation enquiry'),
        fullName: String(body.fullName || ''),
        phone: String(body.phone || ''),
        email: String(body.email || ''),
        studentName: String(body.studentName || ''),
        preferredMoveInDate: String(body.preferredMoveInDate || ''),
        occupantsCount: Number(body.occupantsCount || 1),
        preferredRoomType: String(body.preferredRoomType || ''),
        preferredVisitDate: String(body.preferredVisitDate || ''),
        preferredTimeSlot: String(body.preferredTimeSlot || ''),
        message: String(body.message || ''),
        consentGiven: Boolean(body.consentGiven),
        status: String(body.status || 'New'),
        adminNotes: String(body.adminNotes || ''),
      });

      return res.status(201).json({ enquiry: saved });
    } catch (error: unknown) {
      console.error('Failed to save enquiry:', error);
      const message = error instanceof Error ? error.message : 'Failed to save enquiry';
      return res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
