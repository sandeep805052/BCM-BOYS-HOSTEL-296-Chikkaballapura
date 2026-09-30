import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  upsertEnquiryRecord,
  listEnquiriesFromDb,
} from './src/db/users.ts';
import {
  INITIAL_SITE_CONFIG,
  INITIAL_FACILITIES,
  INITIAL_ROOMS,
  INITIAL_GALLERY,
  INITIAL_FAQS,
} from './src/data/initialData.ts';
import {
  SiteConfig,
  FacilityItem,
  RoomItem,
  GalleryItem,
  FaqItem,
  EnquiryItem,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOTSTRAPPED_ADMIN_EMAIL = 'sandeepssreddy54@gmail.com';

interface ServerRealtimeState {
  siteConfig: SiteConfig;
  facilities: FacilityItem[];
  rooms: RoomItem[];
  gallery: GalleryItem[];
  faqs: FaqItem[];
  enquiries: EnquiryItem[];
}

const realtimeState: ServerRealtimeState = {
  siteConfig: { ...INITIAL_SITE_CONFIG },
  facilities: [...INITIAL_FACILITIES],
  rooms: [...INITIAL_ROOMS],
  gallery: [...INITIAL_GALLERY],
  faqs: [...INITIAL_FAQS],
  enquiries: [],
};

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = 3000;

  // Attach WebSocketServer on /ws sharing port 3000
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const broadcastEvent = (type: string, payload: unknown, excludeSocket?: WebSocket) => {
    const message = JSON.stringify({ type, payload });
    wss.clients.forEach((client) => {
      if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  wss.on('connection', (ws) => {
    // 1. Send initial server-authoritative state on connect
    ws.send(
      JSON.stringify({
        type: 'init',
        payload: realtimeState,
      })
    );

    ws.on('message', (rawBuffer) => {
      try {
        const msg = JSON.parse(rawBuffer.toString()) as {
          type: string;
          payload: any;
        };

        switch (msg.type) {
          case 'enquiry:create': {
            const incoming = msg.payload as EnquiryItem;
            if (!incoming || !incoming.id) break;
            const exists = realtimeState.enquiries.some((e) => e.id === incoming.id);
            if (!exists) {
              realtimeState.enquiries = [incoming, ...realtimeState.enquiries];
              broadcastEvent('enquiry:created', incoming);
            }
            break;
          }
          case 'enquiry:update': {
            const updated = msg.payload as EnquiryItem;
            if (!updated || !updated.id) break;
            realtimeState.enquiries = realtimeState.enquiries.map((e) =>
              e.id === updated.id ? { ...e, ...updated } : e
            );
            broadcastEvent('enquiry:updated', updated);
            break;
          }
          case 'enquiry:delete': {
            const id = String(msg.payload?.id || '');
            if (!id) break;
            realtimeState.enquiries = realtimeState.enquiries.filter((e) => e.id !== id);
            broadcastEvent('enquiry:deleted', { id });
            break;
          }
          case 'config:update': {
            const nextConfig = msg.payload as SiteConfig;
            if (!nextConfig) break;
            realtimeState.siteConfig = { ...realtimeState.siteConfig, ...nextConfig };
            broadcastEvent('config:updated', realtimeState.siteConfig);
            break;
          }
          case 'room:upsert': {
            const room = msg.payload as RoomItem;
            if (!room || !room.id) break;
            const idx = realtimeState.rooms.findIndex((r) => r.id === room.id);
            if (idx >= 0) {
              realtimeState.rooms[idx] = room;
            } else {
              realtimeState.rooms.push(room);
            }
            broadcastEvent('room:upserted', room);
            break;
          }
          case 'room:delete': {
            const id = String(msg.payload?.id || '');
            if (!id) break;
            realtimeState.rooms = realtimeState.rooms.filter((r) => r.id !== id);
            broadcastEvent('room:deleted', { id });
            break;
          }
          case 'facility:upsert': {
            const fac = msg.payload as FacilityItem;
            if (!fac || !fac.id) break;
            const idx = realtimeState.facilities.findIndex((f) => f.id === fac.id);
            if (idx >= 0) {
              realtimeState.facilities[idx] = fac;
            } else {
              realtimeState.facilities.push(fac);
            }
            broadcastEvent('facility:upserted', fac);
            break;
          }
          case 'facility:delete': {
            const id = String(msg.payload?.id || '');
            if (!id) break;
            realtimeState.facilities = realtimeState.facilities.filter((f) => f.id !== id);
            broadcastEvent('facility:deleted', { id });
            break;
          }
          case 'gallery:upsert': {
            const item = msg.payload as GalleryItem;
            if (!item || !item.id) break;
            const idx = realtimeState.gallery.findIndex((g) => g.id === item.id);
            if (idx >= 0) {
              realtimeState.gallery[idx] = item;
            } else {
              realtimeState.gallery.push(item);
            }
            broadcastEvent('gallery:upserted', item);
            break;
          }
          case 'gallery:delete': {
            const id = String(msg.payload?.id || '');
            if (!id) break;
            realtimeState.gallery = realtimeState.gallery.filter((g) => g.id !== id);
            broadcastEvent('gallery:deleted', { id });
            break;
          }
          case 'faq:upsert': {
            const faq = msg.payload as FaqItem;
            if (!faq || !faq.id) break;
            const idx = realtimeState.faqs.findIndex((f) => f.id === faq.id);
            if (idx >= 0) {
              realtimeState.faqs[idx] = faq;
            } else {
              realtimeState.faqs.push(faq);
            }
            broadcastEvent('faq:upserted', faq);
            break;
          }
          case 'faq:delete': {
            const id = String(msg.payload?.id || '');
            if (!id) break;
            realtimeState.faqs = realtimeState.faqs.filter((f) => f.id !== id);
            broadcastEvent('faq:deleted', { id });
            break;
          }
          default:
            break;
        }
      } catch (err) {
        console.error('Failed to process WebSocket message:', err);
      }
    });
  });

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
      const docId = String(body.id || `enq_${Date.now()}`);
      const saved = await upsertEnquiryRecord({
        docId,
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

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP & WebSocket Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
