/**
 * Security Rules Verification Suite for BCM BOYS HOSTEL 296
 * Validates that all 12 "Dirty Dozen" payloads are rejected with PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: {
    uid: string;
    email: string;
    email_verified: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Unverified Email Admin Spoof',
    collection: 'siteConfig',
    docId: 'main',
    operation: 'update',
    auth: { uid: 'attacker1', email: 'sandeepssreddy54@gmail.com', email_verified: false },
    payload: { hostelName: 'Hacked Hostel' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Self-Assigned Admin Privilege Escalation',
    collection: 'admins',
    docId: 'user2',
    operation: 'create',
    auth: { uid: 'user2', email: 'student@example.com', email_verified: true },
    payload: { uid: 'user2', email: 'student@example.com', role: 'admin' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Enquiry Create',
    collection: 'enquiries',
    docId: 'enq_01',
    operation: 'create',
    auth: { uid: 'user3', email: 'user3@example.com', email_verified: true },
    payload: {
      hostelId: 'bcm-296',
      referenceNumber: 'BCM-2026-0001',
      submitterUid: 'user3',
      isVerifiedByStaff: true, // Ghost field
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Identity Spoofing on Enquiry Create',
    collection: 'enquiries',
    docId: 'enq_02',
    operation: 'create',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    payload: {
      hostelId: 'bcm-296',
      referenceNumber: 'BCM-2026-0002',
      submitterUid: 'victim_uid',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'PII Blanket Read by Non-Owner',
    collection: 'enquiries',
    docId: 'enq_owned_by_user_a',
    operation: 'get',
    auth: { uid: 'user_b', email: 'userb@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Unauthorized Query Scraping on Enquiries List',
    collection: 'enquiries',
    docId: '*',
    operation: 'list',
    auth: { uid: 'user_b', email: 'userb@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Resource Poisoning via Invalid Document ID',
    collection: 'enquiries',
    docId: 'invalid$id!with*bad*chars',
    operation: 'create',
    auth: { uid: 'user3', email: 'user3@example.com', email_verified: true },
    payload: {},
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Denial of Wallet Oversized Message String',
    collection: 'enquiries',
    docId: 'enq_03',
    operation: 'create',
    auth: { uid: 'user3', email: 'user3@example.com', email_verified: true },
    payload: {
      message: 'A'.repeat(2500),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Unbounded Array Injection on SiteConfig',
    collection: 'siteConfig',
    docId: 'main',
    operation: 'update',
    auth: { uid: 'admin1', email: 'sandeepssreddy54@gmail.com', email_verified: true },
    payload: {
      availableTimeSlots: new Array(30).fill('10:00 AM'),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Timestamp Forgery on Create',
    collection: 'enquiries',
    docId: 'enq_04',
    operation: 'create',
    auth: { uid: 'user3', email: 'user3@example.com', email_verified: true },
    payload: {
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Immortal Field Mutation on Enquiry Update',
    collection: 'enquiries',
    docId: 'enq_05',
    operation: 'update',
    auth: { uid: 'user3', email: 'user3@example.com', email_verified: true },
    payload: {
      submitterUid: 'someone_else',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Terminal State Bypass by Non-Admin',
    collection: 'enquiries',
    docId: 'enq_completed',
    operation: 'update',
    auth: { uid: 'user3', email: 'user3@example.com', email_verified: true },
    payload: {
      status: 'Pending',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
