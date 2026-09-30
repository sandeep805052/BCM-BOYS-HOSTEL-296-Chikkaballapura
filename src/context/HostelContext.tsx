import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  BOOTSTRAPPED_ADMIN_EMAIL,
  HOSTEL_ID,
  OperationType,
  handleFirestoreError,
} from '../firebase';
import {
  SiteConfig,
  FacilityItem,
  RoomItem,
  GalleryItem,
  FaqItem,
  EnquiryItem,
  EnquiryStatus,
  BLUEPRINT_CONSTRAINTS,
  sanitizeId,
  truncateString,
} from '../types';
import {
  INITIAL_SITE_CONFIG,
  INITIAL_FACILITIES,
  INITIAL_ROOMS,
  INITIAL_GALLERY,
  INITIAL_FAQS,
} from '../data/initialData';
import { saveEnquiryToSupabase, subscribeToSupabaseAppointments } from '../lib/supabase';

interface HostelContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  siteConfig: SiteConfig;
  facilities: FacilityItem[];
  rooms: RoomItem[];
  gallery: GalleryItem[];
  faqs: FaqItem[];
  enquiries: EnquiryItem[];
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  submitEnquiry: (
    payload: Omit<
      EnquiryItem,
      'id' | 'hostelId' | 'referenceNumber' | 'submitterUid' | 'status' | 'adminNotes' | 'createdAtIso'
    >
  ) => Promise<EnquiryItem>;
  updateEnquiryAdmin: (
    id: string,
    updates: {
      status: EnquiryStatus;
      adminNotes: string;
      preferredVisitDate: string;
      preferredTimeSlot: string;
    }
  ) => Promise<void>;
  deleteEnquiryAdmin: (id: string) => Promise<void>;
  saveSiteConfig: (nextConfig: SiteConfig) => Promise<void>;
  saveFacility: (facility: FacilityItem) => Promise<void>;
  deleteFacility: (id: string) => Promise<void>;
  saveRoom: (room: RoomItem) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  saveGalleryItem: (item: GalleryItem) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;
  saveFaqItem: (faq: FaqItem) => Promise<void>;
  deleteFaqItem: (id: string) => Promise<void>;
}

const STORAGE_KEYS = {
  SITE_CONFIG: 'bcm296_site_config_v1',
  FACILITIES: 'bcm296_facilities_v1',
  ROOMS: 'bcm296_rooms_v1',
  GALLERY: 'bcm296_gallery_v1',
  FAQS: 'bcm296_faqs_v1',
  ENQUIRIES: 'bcm296_enquiries_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore quota errors on localStorage
  }
}

const HostelContext = createContext<HostelContextValue | undefined>(undefined);

export const HostelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() =>
    loadFromStorage(STORAGE_KEYS.SITE_CONFIG, INITIAL_SITE_CONFIG)
  );
  const [facilities, setFacilities] = useState<FacilityItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.FACILITIES, INITIAL_FACILITIES)
  );
  const [rooms, setRooms] = useState<RoomItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.ROOMS, INITIAL_ROOMS)
  );
  const [gallery, setGallery] = useState<GalleryItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.GALLERY, INITIAL_GALLERY)
  );
  const [faqs, setFaqs] = useState<FaqItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.FAQS, INITIAL_FAQS)
  );
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.ENQUIRIES, [])
  );

  // WebSocket client & pending outbound queue
  const wsRef = useRef<WebSocket | null>(null);
  const pendingQueueRef = useRef<string[]>([]);

  const emitSocketEvent = (type: string, payload: unknown) => {
    const serialized = JSON.stringify({ type, payload });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(serialized);
    } else {
      pendingQueueRef.current.push(serialized);
    }
  };

  // Connect to /ws WebSocket server + Supabase Realtime WebSocket channel
  useEffect(() => {
    let isMounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectWebSocket = () => {
      if (!isMounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        while (pendingQueueRef.current.length > 0 && socket.readyState === WebSocket.OPEN) {
          const msg = pendingQueueRef.current.shift();
          if (msg) socket.send(msg);
        }
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as { type: string; payload: any };
          switch (msg.type) {
            case 'init': {
              const serverEnquiries: EnquiryItem[] = msg.payload?.enquiries || [];
              if (serverEnquiries.length > 0) {
                setEnquiries((prev) => {
                  const map = new Map<string, EnquiryItem>();
                  [...serverEnquiries, ...prev].forEach((item) => {
                    if (!map.has(item.referenceNumber)) {
                      map.set(item.referenceNumber, item);
                    }
                  });
                  const merged = Array.from(map.values()).sort((a, b) =>
                    b.createdAtIso.localeCompare(a.createdAtIso)
                  );
                  saveToStorage(STORAGE_KEYS.ENQUIRIES, merged);
                  return merged;
                });
              }
              break;
            }
            case 'enquiry:created': {
              const incoming = msg.payload as EnquiryItem;
              if (!incoming?.id) break;
              setEnquiries((prev) => {
                if (
                  prev.some(
                    (e) =>
                      e.id === incoming.id ||
                      e.referenceNumber === incoming.referenceNumber
                  )
                ) {
                  return prev;
                }
                const next = [incoming, ...prev];
                saveToStorage(STORAGE_KEYS.ENQUIRIES, next);
                return next;
              });
              break;
            }
            case 'enquiry:updated': {
              const updated = msg.payload as EnquiryItem;
              if (!updated?.id) break;
              setEnquiries((prev) => {
                const next = prev.map((e) =>
                  e.id === updated.id || e.referenceNumber === updated.referenceNumber
                    ? { ...e, ...updated }
                    : e
                );
                saveToStorage(STORAGE_KEYS.ENQUIRIES, next);
                return next;
              });
              break;
            }
            case 'enquiry:deleted': {
              const deletedId = String(msg.payload?.id || '');
              if (!deletedId) break;
              setEnquiries((prev) => {
                const next = prev.filter((e) => e.id !== deletedId);
                saveToStorage(STORAGE_KEYS.ENQUIRIES, next);
                return next;
              });
              break;
            }
            case 'config:updated': {
              const nextCfg = msg.payload as SiteConfig;
              if (!nextCfg) break;
              setSiteConfig((prev) => {
                const merged = { ...prev, ...nextCfg };
                saveToStorage(STORAGE_KEYS.SITE_CONFIG, merged);
                return merged;
              });
              break;
            }
            case 'room:upserted': {
              const room = msg.payload as RoomItem;
              if (!room?.id) break;
              setRooms((prev) => {
                const exists = prev.some((r) => r.id === room.id);
                const next = exists
                  ? prev.map((r) => (r.id === room.id ? room : r))
                  : [...prev, room];
                saveToStorage(STORAGE_KEYS.ROOMS, next);
                return next;
              });
              break;
            }
            case 'room:deleted': {
              const id = String(msg.payload?.id || '');
              if (!id) break;
              setRooms((prev) => {
                const next = prev.filter((r) => r.id !== id);
                saveToStorage(STORAGE_KEYS.ROOMS, next);
                return next;
              });
              break;
            }
            case 'facility:upserted': {
              const fac = msg.payload as FacilityItem;
              if (!fac?.id) break;
              setFacilities((prev) => {
                const exists = prev.some((f) => f.id === fac.id);
                const next = exists
                  ? prev.map((f) => (f.id === fac.id ? fac : f))
                  : [...prev, fac];
                saveToStorage(STORAGE_KEYS.FACILITIES, next);
                return next;
              });
              break;
            }
            case 'facility:deleted': {
              const id = String(msg.payload?.id || '');
              if (!id) break;
              setFacilities((prev) => {
                const next = prev.filter((f) => f.id !== id);
                saveToStorage(STORAGE_KEYS.FACILITIES, next);
                return next;
              });
              break;
            }
            case 'gallery:upserted': {
              const gal = msg.payload as GalleryItem;
              if (!gal?.id) break;
              setGallery((prev) => {
                const exists = prev.some((g) => g.id === gal.id);
                const next = exists
                  ? prev.map((g) => (g.id === gal.id ? gal : g))
                  : [...prev, gal];
                saveToStorage(STORAGE_KEYS.GALLERY, next);
                return next;
              });
              break;
            }
            case 'gallery:deleted': {
              const id = String(msg.payload?.id || '');
              if (!id) break;
              setGallery((prev) => {
                const next = prev.filter((g) => g.id !== id);
                saveToStorage(STORAGE_KEYS.GALLERY, next);
                return next;
              });
              break;
            }
            case 'faq:upserted': {
              const faq = msg.payload as FaqItem;
              if (!faq?.id) break;
              setFaqs((prev) => {
                const exists = prev.some((f) => f.id === faq.id);
                const next = exists
                  ? prev.map((f) => (f.id === faq.id ? faq : f))
                  : [...prev, faq];
                saveToStorage(STORAGE_KEYS.FAQS, next);
                return next;
              });
              break;
            }
            case 'faq:deleted': {
              const id = String(msg.payload?.id || '');
              if (!id) break;
              setFaqs((prev) => {
                const next = prev.filter((f) => f.id !== id);
                saveToStorage(STORAGE_KEYS.FAQS, next);
                return next;
              });
              break;
            }
            default:
              break;
          }
        } catch {
          // Ignore malformed frame
        }
      };

      socket.onclose = () => {
        if (isMounted) {
          reconnectTimer = setTimeout(connectWebSocket, 2500);
        }
      };
    };

    connectWebSocket();

    // Subscribe to Supabase Realtime WebSocket channel
    const unsubSupabaseWs = subscribeToSupabaseAppointments((supaItem) => {
      setEnquiries((prev) => {
        const exists = prev.some((e) => e.referenceNumber === supaItem.referenceNumber);
        const next = exists
          ? prev.map((e) =>
              e.referenceNumber === supaItem.referenceNumber ? { ...e, ...supaItem } : e
            )
          : [supaItem, ...prev];
        saveToStorage(STORAGE_KEYS.ENQUIRIES, next);
        return next;
      });
    });

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
      unsubSupabaseWs();
    };
  }, []);

  // Track Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.emailVerified) {
        const isBootstrapped =
          currentUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
        if (isBootstrapped) {
          setIsAdmin(true);
          // Ensure admin profile exists in Firestore
          const adminPath = `admins/${currentUser.uid}`;
          try {
            const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
            if (!adminSnap.exists()) {
              await setDoc(doc(db, 'admins', currentUser.uid), {
                uid: currentUser.uid,
                email: truncateString(currentUser.email || BOOTSTRAPPED_ADMIN_EMAIL, 120),
                role: 'admin',
                createdAt: serverTimestamp(),
              });
            }
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, adminPath);
          }
        } else {
          try {
            const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
            setIsAdmin(adminSnap.exists());
          } catch {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Attach Firestore listeners ONLY when auth is ready and user is authenticated
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      return;
    }

    // 1. SiteConfig listener
    const siteConfigRef = doc(db, 'siteConfig', 'main');
    const unsubConfig = onSnapshot(
      siteConfigRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as SiteConfig;
          setSiteConfig(data);
          saveToStorage(STORAGE_KEYS.SITE_CONFIG, data);
        } else if (isAdmin) {
          // Seed initial siteConfig if admin logs in and document doesn't exist
          try {
            const initialPayload = {
              ...siteConfig,
              hostelId: HOSTEL_ID,
              updatedBy: user.uid,
              updatedAt: serverTimestamp(),
            };
            await setDoc(siteConfigRef, initialPayload);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, 'siteConfig/main');
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'siteConfig/main');
      }
    );

    // 2. Facilities listener
    const facilitiesQuery = query(
      collection(db, 'facilities'),
      where('hostelId', '==', HOSTEL_ID)
    );
    const unsubFacilities = onSnapshot(
      facilitiesQuery,
      async (snapshot) => {
        if (!snapshot.empty) {
          const list: FacilityItem[] = snapshot.docs
            .map((d) => ({ ...(d.data() as Omit<FacilityItem, 'id'>), id: d.id }))
            .sort((a, b) => a.order - b.order);
          setFacilities(list);
          saveToStorage(STORAGE_KEYS.FACILITIES, list);
        } else if (isAdmin) {
          for (const item of INITIAL_FACILITIES) {
            try {
              const { id, ...rest } = item;
              await setDoc(doc(db, 'facilities', sanitizeId(id)), {
                ...rest,
                hostelId: HOSTEL_ID,
                updatedBy: user.uid,
                updatedAt: serverTimestamp(),
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `facilities/${item.id}`);
            }
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'facilities');
      }
    );

    // 3. Rooms listener
    const roomsQuery = query(collection(db, 'rooms'), where('hostelId', '==', HOSTEL_ID));
    const unsubRooms = onSnapshot(
      roomsQuery,
      async (snapshot) => {
        if (!snapshot.empty) {
          const list: RoomItem[] = snapshot.docs
            .map((d) => ({ ...(d.data() as Omit<RoomItem, 'id'>), id: d.id }))
            .sort((a, b) => a.order - b.order);
          setRooms(list);
          saveToStorage(STORAGE_KEYS.ROOMS, list);
        } else if (isAdmin) {
          for (const room of INITIAL_ROOMS) {
            try {
              const { id, ...rest } = room;
              await setDoc(doc(db, 'rooms', sanitizeId(id)), {
                ...rest,
                hostelId: HOSTEL_ID,
                updatedBy: user.uid,
                updatedAt: serverTimestamp(),
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `rooms/${room.id}`);
            }
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'rooms');
      }
    );

    // 4. Gallery listener
    const galleryQuery = query(collection(db, 'gallery'), where('hostelId', '==', HOSTEL_ID));
    const unsubGallery = onSnapshot(
      galleryQuery,
      async (snapshot) => {
        if (!snapshot.empty) {
          const list: GalleryItem[] = snapshot.docs
            .map((d) => ({ ...(d.data() as Omit<GalleryItem, 'id'>), id: d.id }))
            .sort((a, b) => a.order - b.order);
          setGallery(list);
          saveToStorage(STORAGE_KEYS.GALLERY, list);
        } else if (isAdmin) {
          for (const gal of INITIAL_GALLERY) {
            try {
              const { id, ...rest } = gal;
              await setDoc(doc(db, 'gallery', sanitizeId(id)), {
                ...rest,
                hostelId: HOSTEL_ID,
                updatedBy: user.uid,
                updatedAt: serverTimestamp(),
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `gallery/${gal.id}`);
            }
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'gallery');
      }
    );

    // 5. FAQs listener
    const faqsQuery = query(collection(db, 'faqs'), where('hostelId', '==', HOSTEL_ID));
    const unsubFaqs = onSnapshot(
      faqsQuery,
      async (snapshot) => {
        if (!snapshot.empty) {
          const list: FaqItem[] = snapshot.docs
            .map((d) => ({ ...(d.data() as Omit<FaqItem, 'id'>), id: d.id }))
            .sort((a, b) => a.order - b.order);
          setFaqs(list);
          saveToStorage(STORAGE_KEYS.FAQS, list);
        } else if (isAdmin) {
          for (const faq of INITIAL_FAQS) {
            try {
              const { id, ...rest } = faq;
              await setDoc(doc(db, 'faqs', sanitizeId(id)), {
                ...rest,
                hostelId: HOSTEL_ID,
                updatedBy: user.uid,
                updatedAt: serverTimestamp(),
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `faqs/${faq.id}`);
            }
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'faqs');
      }
    );

    // 6. Enquiries listener (Admin queries by hostelId, regular user queries by submitterUid)
    const isBootstrappedAdminUser =
      user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
    const enquiriesQuery = isBootstrappedAdminUser
      ? query(collection(db, 'enquiries'), where('hostelId', '==', HOSTEL_ID))
      : query(collection(db, 'enquiries'), where('submitterUid', '==', user.uid));

    const unsubEnquiries = onSnapshot(
      enquiriesQuery,
      (snapshot) => {
        const cloudDocs: EnquiryItem[] = snapshot.docs.map((d) => {
          const raw = d.data();
          const createdTimestamp = raw.createdAt as { toDate?: () => Date } | undefined;
          const createdAtIso =
            createdTimestamp && typeof createdTimestamp.toDate === 'function'
              ? createdTimestamp.toDate().toISOString()
              : new Date().toISOString();
          return {
            id: d.id,
            hostelId: 'bcm-296',
            referenceNumber: String(raw.referenceNumber || ''),
            submitterUid: String(raw.submitterUid || ''),
            requirementType: raw.requirementType,
            fullName: String(raw.fullName || ''),
            phone: String(raw.phone || ''),
            email: String(raw.email || ''),
            studentName: String(raw.studentName || ''),
            preferredMoveInDate: String(raw.preferredMoveInDate || ''),
            occupantsCount: Number(raw.occupantsCount || 1),
            preferredRoomType: String(raw.preferredRoomType || ''),
            preferredVisitDate: String(raw.preferredVisitDate || ''),
            preferredTimeSlot: String(raw.preferredTimeSlot || ''),
            message: String(raw.message || ''),
            consentGiven: Boolean(raw.consentGiven),
            status: raw.status,
            adminNotes: String(raw.adminNotes || ''),
            createdAtIso,
            syncedToCloud: true,
          };
        });

        // Merge with any unsynced local enquiries
        const localExisting = loadFromStorage<EnquiryItem[]>(STORAGE_KEYS.ENQUIRIES, []);
        const unsyncedLocal = localExisting.filter(
          (loc) => !cloudDocs.some((c) => c.id === loc.id)
        );

        // Sync any unsynced local enquiries into Firestore under current verified user
        unsyncedLocal.forEach(async (loc) => {
          try {
            const docId = sanitizeId(loc.id);
            await setDoc(doc(db, 'enquiries', docId), {
              hostelId: HOSTEL_ID,
              referenceNumber: sanitizeId(loc.referenceNumber).slice(0, 32),
              submitterUid: user.uid,
              requirementType: loc.requirementType,
              fullName: truncateString(loc.fullName, BLUEPRINT_CONSTRAINTS.ENQUIRY_NAME_MAX),
              phone: truncateString(loc.phone, BLUEPRINT_CONSTRAINTS.PHONE_MAX),
              email: truncateString(loc.email, BLUEPRINT_CONSTRAINTS.EMAIL_MAX),
              studentName: truncateString(loc.studentName, BLUEPRINT_CONSTRAINTS.ENQUIRY_NAME_MAX),
              preferredMoveInDate: truncateString(loc.preferredMoveInDate, 30),
              occupantsCount: Math.min(20, Math.max(1, Number(loc.occupantsCount) || 1)),
              preferredRoomType: truncateString(loc.preferredRoomType, 100),
              preferredVisitDate: truncateString(loc.preferredVisitDate, 30),
              preferredTimeSlot: truncateString(loc.preferredTimeSlot, 60),
              message: truncateString(loc.message, BLUEPRINT_CONSTRAINTS.ENQUIRY_MESSAGE_MAX),
              consentGiven: true,
              status: isAdmin ? loc.status : 'New',
              adminNotes: truncateString(
                loc.adminNotes || '',
                BLUEPRINT_CONSTRAINTS.ENQUIRY_ADMIN_NOTES_MAX
              ),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch {
            // Keep locally if cloud write fails
          }
        });

        const merged = [...cloudDocs, ...unsyncedLocal].sort((a, b) =>
          b.createdAtIso.localeCompare(a.createdAtIso)
        );
        setEnquiries(merged);
        saveToStorage(STORAGE_KEYS.ENQUIRIES, merged);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'enquiries');
      }
    );

    return () => {
      unsubConfig();
      unsubFacilities();
      unsubRooms();
      unsubGallery();
      unsubFaqs();
      unsubEnquiries();
    };
  }, [authReady, user, isAdmin]);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOutUser = async () => {
    await firebaseSignOut(auth);
  };

  const submitEnquiry: HostelContextValue['submitEnquiry'] = async (payload) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const referenceNumber = `BCM-${dateStamp}-${randomSuffix}`;
    const docId = sanitizeId(`enq_${Date.now()}_${randomSuffix}`);

    const newEnquiry: EnquiryItem = {
      id: docId,
      hostelId: 'bcm-296',
      referenceNumber,
      submitterUid: user?.uid || 'guest_local',
      requirementType: payload.requirementType,
      fullName: truncateString(payload.fullName, BLUEPRINT_CONSTRAINTS.ENQUIRY_NAME_MAX),
      phone: truncateString(payload.phone, BLUEPRINT_CONSTRAINTS.PHONE_MAX),
      email: truncateString(payload.email, BLUEPRINT_CONSTRAINTS.EMAIL_MAX),
      studentName: truncateString(payload.studentName, BLUEPRINT_CONSTRAINTS.ENQUIRY_NAME_MAX),
      preferredMoveInDate: truncateString(payload.preferredMoveInDate, 30),
      occupantsCount: Math.min(20, Math.max(1, Number(payload.occupantsCount) || 1)),
      preferredRoomType: truncateString(payload.preferredRoomType, 100),
      preferredVisitDate: truncateString(payload.preferredVisitDate, 30),
      preferredTimeSlot: truncateString(payload.preferredTimeSlot, 60),
      message: truncateString(payload.message, BLUEPRINT_CONSTRAINTS.ENQUIRY_MESSAGE_MAX),
      consentGiven: true,
      status: 'New',
      adminNotes: '',
      createdAtIso: new Date().toISOString(),
      syncedToCloud: Boolean(user && user.emailVerified),
    };

    // Broadcast over WebSocket immediately for real-time multi-user sync
    emitSocketEvent('enquiry:create', newEnquiry);

    // Automatically send booking data to the user's Supabase database
    try {
      await saveEnquiryToSupabase(newEnquiry);
    } catch {
      // Non-blocking fallback
    }

    if (user && user.emailVerified) {
      try {
        const idToken = await user.getIdToken();
        await fetch('/api/enquiries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(newEnquiry),
        });
      } catch {
        // Non-blocking fallback
      }

      const path = `enquiries/${docId}`;
      try {
        await setDoc(doc(db, 'enquiries', docId), {
          hostelId: HOSTEL_ID,
          referenceNumber: newEnquiry.referenceNumber,
          submitterUid: user.uid,
          requirementType: newEnquiry.requirementType,
          fullName: newEnquiry.fullName,
          phone: newEnquiry.phone,
          email: newEnquiry.email,
          studentName: newEnquiry.studentName,
          preferredMoveInDate: newEnquiry.preferredMoveInDate,
          occupantsCount: newEnquiry.occupantsCount,
          preferredRoomType: newEnquiry.preferredRoomType,
          preferredVisitDate: newEnquiry.preferredVisitDate,
          preferredTimeSlot: newEnquiry.preferredTimeSlot,
          message: newEnquiry.message,
          consentGiven: true,
          status: 'New',
          adminNotes: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      const updated = [newEnquiry, ...enquiries];
      setEnquiries(updated);
      saveToStorage(STORAGE_KEYS.ENQUIRIES, updated);
    }

    return newEnquiry;
  };

  const updateEnquiryAdmin: HostelContextValue['updateEnquiryAdmin'] = async (id, updates) => {
    const cleanId = sanitizeId(id);
    const updatedList = enquiries.map((item) =>
      item.id === id
        ? {
            ...item,
            status: updates.status,
            adminNotes: truncateString(
              updates.adminNotes,
              BLUEPRINT_CONSTRAINTS.ENQUIRY_ADMIN_NOTES_MAX
            ),
            preferredVisitDate: truncateString(updates.preferredVisitDate, 30),
            preferredTimeSlot: truncateString(updates.preferredTimeSlot, 60),
          }
        : item
    );
    setEnquiries(updatedList);
    saveToStorage(STORAGE_KEYS.ENQUIRIES, updatedList);
    const updatedTarget = updatedList.find((item) => item.id === id);
    if (updatedTarget) {
      emitSocketEvent('enquiry:update', updatedTarget);
    }

    if (user && user.emailVerified && isAdmin) {
      const path = `enquiries/${cleanId}`;
      try {
        await updateDoc(doc(db, 'enquiries', cleanId), {
          status: updates.status,
          adminNotes: truncateString(
            updates.adminNotes,
            BLUEPRINT_CONSTRAINTS.ENQUIRY_ADMIN_NOTES_MAX
          ),
          preferredVisitDate: truncateString(updates.preferredVisitDate, 30),
          preferredTimeSlot: truncateString(updates.preferredTimeSlot, 60),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  };

  const deleteEnquiryAdmin = async (id: string) => {
    const cleanId = sanitizeId(id);
    const next = enquiries.filter((e) => e.id !== id);
    setEnquiries(next);
    saveToStorage(STORAGE_KEYS.ENQUIRIES, next);
    emitSocketEvent('enquiry:delete', { id });

    if (user && user.emailVerified && isAdmin) {
      const path = `enquiries/${cleanId}`;
      try {
        await deleteDoc(doc(db, 'enquiries', cleanId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const saveSiteConfig = async (nextConfig: SiteConfig) => {
    const sanitized: SiteConfig = {
      hostelId: 'bcm-296',
      hostelName: truncateString(nextConfig.hostelName, BLUEPRINT_CONSTRAINTS.HOSTEL_NAME_MAX),
      address: truncateString(nextConfig.address, BLUEPRINT_CONSTRAINTS.ADDRESS_MAX),
      phone: truncateString(nextConfig.phone, BLUEPRINT_CONSTRAINTS.PHONE_MAX),
      email: truncateString(nextConfig.email, BLUEPRINT_CONSTRAINTS.EMAIL_MAX),
      openingHours: truncateString(
        nextConfig.openingHours,
        BLUEPRINT_CONSTRAINTS.OPENING_HOURS_MAX
      ),
      aboutHeading: truncateString(
        nextConfig.aboutHeading,
        BLUEPRINT_CONSTRAINTS.ABOUT_HEADING_MAX
      ),
      aboutDescription: truncateString(
        nextConfig.aboutDescription,
        BLUEPRINT_CONSTRAINTS.ABOUT_DESC_MAX
      ),
      admissionRequirements: truncateString(
        nextConfig.admissionRequirements,
        BLUEPRINT_CONSTRAINTS.ADMISSION_REQ_MAX
      ),
      availableDays: nextConfig.availableDays.slice(0, 7).map((d) => truncateString(d, 20)),
      availableTimeSlots: nextConfig.availableTimeSlots
        .slice(0, 16)
        .map((s) => truncateString(s, 50)),
      blockedDates: nextConfig.blockedDates.slice(0, 60).map((d) => truncateString(d, 20)),
      heroPhotoUrl: truncateString(nextConfig.heroPhotoUrl, BLUEPRINT_CONSTRAINTS.PHOTO_URL_MAX),
      aboutMainPhotoUrl: truncateString(
        nextConfig.aboutMainPhotoUrl,
        BLUEPRINT_CONSTRAINTS.PHOTO_URL_MAX
      ),
      aboutSecondaryPhotoUrl: truncateString(
        nextConfig.aboutSecondaryPhotoUrl,
        BLUEPRINT_CONSTRAINTS.PHOTO_URL_MAX
      ),
      updatedBy: user?.uid || 'local_admin',
    };

    setSiteConfig(sanitized);
    saveToStorage(STORAGE_KEYS.SITE_CONFIG, sanitized);
    emitSocketEvent('config:update', sanitized);

    if (user && user.emailVerified && isAdmin) {
      const path = 'siteConfig/main';
      try {
        await setDoc(doc(db, 'siteConfig', 'main'), {
          ...sanitized,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const saveFacility = async (facility: FacilityItem) => {
    const cleanId = sanitizeId(facility.id);
    const sanitized: FacilityItem = {
      id: cleanId,
      hostelId: 'bcm-296',
      name: truncateString(facility.name, BLUEPRINT_CONSTRAINTS.FACILITY_NAME_MAX),
      description: truncateString(facility.description, BLUEPRINT_CONSTRAINTS.FACILITY_DESC_MAX),
      iconName: truncateString(facility.iconName || 'CheckCircle', 40),
      verified: Boolean(facility.verified),
      active: Boolean(facility.active),
      order: Number(facility.order) || 1,
      updatedBy: user?.uid || 'local_admin',
    };

    const existsIdx = facilities.findIndex((f) => f.id === cleanId);
    const nextList =
      existsIdx >= 0
        ? facilities.map((f) => (f.id === cleanId ? sanitized : f))
        : [...facilities, sanitized];
    setFacilities(nextList);
    saveToStorage(STORAGE_KEYS.FACILITIES, nextList);
    emitSocketEvent('facility:upsert', sanitized);

    if (user && user.emailVerified && isAdmin) {
      const path = `facilities/${cleanId}`;
      try {
        const { id, ...rest } = sanitized;
        await setDoc(doc(db, 'facilities', cleanId), {
          ...rest,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const deleteFacility = async (id: string) => {
    const cleanId = sanitizeId(id);
    const nextList = facilities.filter((f) => f.id !== cleanId);
    setFacilities(nextList);
    saveToStorage(STORAGE_KEYS.FACILITIES, nextList);
    emitSocketEvent('facility:delete', { id: cleanId });

    if (user && user.emailVerified && isAdmin) {
      const path = `facilities/${cleanId}`;
      try {
        await deleteDoc(doc(db, 'facilities', cleanId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const saveRoom = async (room: RoomItem) => {
    const cleanId = sanitizeId(room.id);
    const sanitized: RoomItem = {
      id: cleanId,
      hostelId: 'bcm-296',
      name: truncateString(room.name, BLUEPRINT_CONSTRAINTS.ROOM_NAME_MAX),
      occupancy: truncateString(room.occupancy, BLUEPRINT_CONSTRAINTS.ROOM_OCCUPANCY_MAX),
      status: room.status,
      priceText: truncateString(room.priceText, BLUEPRINT_CONSTRAINTS.ROOM_PRICE_MAX),
      depositText: truncateString(room.depositText, BLUEPRINT_CONSTRAINTS.ROOM_DEPOSIT_MAX),
      facilitiesText: truncateString(
        room.facilitiesText,
        BLUEPRINT_CONSTRAINTS.ROOM_FACILITIES_MAX
      ),
      photoUrl: truncateString(room.photoUrl, BLUEPRINT_CONSTRAINTS.PHOTO_URL_MAX),
      photoAlt: truncateString(
        room.photoAlt || `${room.name} at BCM BOYS HOSTEL 296`,
        BLUEPRINT_CONSTRAINTS.ROOM_ALT_MAX
      ),
      verified: Boolean(room.verified),
      order: Number(room.order) || 1,
      updatedBy: user?.uid || 'local_admin',
    };

    const existsIdx = rooms.findIndex((r) => r.id === cleanId);
    const nextList =
      existsIdx >= 0 ? rooms.map((r) => (r.id === cleanId ? sanitized : r)) : [...rooms, sanitized];
    setRooms(nextList);
    saveToStorage(STORAGE_KEYS.ROOMS, nextList);
    emitSocketEvent('room:upsert', sanitized);

    if (user && user.emailVerified && isAdmin) {
      const path = `rooms/${cleanId}`;
      try {
        const { id, ...rest } = sanitized;
        await setDoc(doc(db, 'rooms', cleanId), {
          ...rest,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const deleteRoom = async (id: string) => {
    const cleanId = sanitizeId(id);
    const nextList = rooms.filter((r) => r.id !== cleanId);
    setRooms(nextList);
    saveToStorage(STORAGE_KEYS.ROOMS, nextList);
    emitSocketEvent('room:delete', { id: cleanId });

    if (user && user.emailVerified && isAdmin) {
      const path = `rooms/${cleanId}`;
      try {
        await deleteDoc(doc(db, 'rooms', cleanId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const saveGalleryItem = async (item: GalleryItem) => {
    const cleanId = sanitizeId(item.id);
    const sanitized: GalleryItem = {
      id: cleanId,
      hostelId: 'bcm-296',
      title: truncateString(item.title, BLUEPRINT_CONSTRAINTS.GALLERY_TITLE_MAX),
      category: item.category,
      altText: truncateString(item.altText || item.title, BLUEPRINT_CONSTRAINTS.GALLERY_ALT_MAX),
      imageUrl: truncateString(item.imageUrl, BLUEPRINT_CONSTRAINTS.PHOTO_URL_MAX),
      isRealPhoto: Boolean(item.imageUrl && item.imageUrl.trim().length > 0),
      order: Number(item.order) || 1,
      updatedBy: user?.uid || 'local_admin',
    };

    const existsIdx = gallery.findIndex((g) => g.id === cleanId);
    const nextList =
      existsIdx >= 0
        ? gallery.map((g) => (g.id === cleanId ? sanitized : g))
        : [...gallery, sanitized];
    setGallery(nextList);
    saveToStorage(STORAGE_KEYS.GALLERY, nextList);
    emitSocketEvent('gallery:upsert', sanitized);

    if (user && user.emailVerified && isAdmin) {
      const path = `gallery/${cleanId}`;
      try {
        const { id, ...rest } = sanitized;
        await setDoc(doc(db, 'gallery', cleanId), {
          ...rest,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const deleteGalleryItem = async (id: string) => {
    const cleanId = sanitizeId(id);
    const nextList = gallery.filter((g) => g.id !== cleanId);
    setGallery(nextList);
    saveToStorage(STORAGE_KEYS.GALLERY, nextList);
    emitSocketEvent('gallery:delete', { id: cleanId });

    if (user && user.emailVerified && isAdmin) {
      const path = `gallery/${cleanId}`;
      try {
        await deleteDoc(doc(db, 'gallery', cleanId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const saveFaqItem = async (faq: FaqItem) => {
    const cleanId = sanitizeId(faq.id);
    const sanitized: FaqItem = {
      id: cleanId,
      hostelId: 'bcm-296',
      question: truncateString(faq.question, BLUEPRINT_CONSTRAINTS.FAQ_QUESTION_MAX),
      answer: truncateString(faq.answer, BLUEPRINT_CONSTRAINTS.FAQ_ANSWER_MAX),
      isVerifiedAnswer: Boolean(faq.isVerifiedAnswer),
      order: Number(faq.order) || 1,
      updatedBy: user?.uid || 'local_admin',
    };

    const existsIdx = faqs.findIndex((f) => f.id === cleanId);
    const nextList =
      existsIdx >= 0 ? faqs.map((f) => (f.id === cleanId ? sanitized : f)) : [...faqs, sanitized];
    setFaqs(nextList);
    saveToStorage(STORAGE_KEYS.FAQS, nextList);
    emitSocketEvent('faq:upsert', sanitized);

    if (user && user.emailVerified && isAdmin) {
      const path = `faqs/${cleanId}`;
      try {
        const { id, ...rest } = sanitized;
        await setDoc(doc(db, 'faqs', cleanId), {
          ...rest,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const deleteFaqItem = async (id: string) => {
    const cleanId = sanitizeId(id);
    const nextList = faqs.filter((f) => f.id !== cleanId);
    setFaqs(nextList);
    saveToStorage(STORAGE_KEYS.FAQS, nextList);
    emitSocketEvent('faq:delete', { id: cleanId });

    if (user && user.emailVerified && isAdmin) {
      const path = `faqs/${cleanId}`;
      try {
        await deleteDoc(doc(db, 'faqs', cleanId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  return (
    <HostelContext.Provider
      value={{
        user,
        authReady,
        isAdmin,
        siteConfig,
        facilities,
        rooms,
        gallery,
        faqs,
        enquiries,
        signInWithGoogle,
        signOutUser,
        submitEnquiry,
        updateEnquiryAdmin,
        deleteEnquiryAdmin,
        saveSiteConfig,
        saveFacility,
        deleteFacility,
        saveRoom,
        deleteRoom,
        saveGalleryItem,
        deleteGalleryItem,
        saveFaqItem,
        deleteFaqItem,
      }}
    >
      {children}
    </HostelContext.Provider>
  );
};

export function useHostel() {
  const ctx = useContext(HostelContext);
  if (!ctx) {
    throw new Error('useHostel must be used within a HostelProvider');
  }
  return ctx;
}

/**
 * Compresses an uploaded image file to a compact WebP/JPEG data URL (< 220KB)
 * so real property photographs can be stored directly in Firestore documents.
 */
export function compressImageFile(file: File, maxWidth = 1200, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = String(e.target?.result || '');
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
