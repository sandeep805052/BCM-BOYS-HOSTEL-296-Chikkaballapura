export type RequirementType = 'Accommodation enquiry' | 'Hostel visit' | 'General enquiry';

export type EnquiryStatus =
  | 'New'
  | 'Pending'
  | 'Confirmed'
  | 'Rescheduled'
  | 'Completed'
  | 'Cancelled';

export type RoomAvailabilityStatus = 'Available' | 'Unavailable' | 'Contact for Availability';

export type GalleryCategory =
  | 'Exterior'
  | 'Rooms'
  | 'Study Areas'
  | 'Dining'
  | 'Common Areas'
  | 'Facilities'
  | 'Surroundings';

export interface SiteConfig {
  hostelId: 'bcm-296';
  hostelName: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  aboutHeading: string;
  aboutDescription: string;
  admissionRequirements: string;
  availableDays: string[];
  availableTimeSlots: string[];
  blockedDates: string[];
  heroPhotoUrl: string;
  aboutMainPhotoUrl: string;
  aboutSecondaryPhotoUrl: string;
  updatedBy: string;
  updatedAt?: unknown;
}

export interface FacilityItem {
  id: string;
  hostelId: 'bcm-296';
  name: string;
  description: string;
  iconName: string;
  verified: boolean;
  active: boolean;
  order: number;
  updatedBy: string;
  updatedAt?: unknown;
}

export interface RoomItem {
  id: string;
  hostelId: 'bcm-296';
  name: string;
  occupancy: string;
  status: RoomAvailabilityStatus;
  priceText: string;
  depositText: string;
  facilitiesText: string;
  photoUrl: string;
  photoAlt: string;
  verified: boolean;
  order: number;
  updatedBy: string;
  updatedAt?: unknown;
}

export interface GalleryItem {
  id: string;
  hostelId: 'bcm-296';
  title: string;
  category: GalleryCategory;
  altText: string;
  imageUrl: string;
  isRealPhoto: boolean;
  order: number;
  updatedBy: string;
  updatedAt?: unknown;
}

export interface FaqItem {
  id: string;
  hostelId: 'bcm-296';
  question: string;
  answer: string;
  isVerifiedAnswer: boolean;
  order: number;
  updatedBy: string;
  updatedAt?: unknown;
}

export interface EnquiryItem {
  id: string;
  hostelId: 'bcm-296';
  referenceNumber: string;
  submitterUid: string;
  requirementType: RequirementType;
  fullName: string;
  phone: string;
  email: string;
  studentName: string;
  preferredMoveInDate: string;
  occupantsCount: number;
  preferredRoomType: string;
  preferredVisitDate: string;
  preferredTimeSlot: string;
  message: string;
  consentGiven: boolean;
  status: EnquiryStatus;
  adminNotes: string;
  createdAtIso: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  syncedToCloud?: boolean;
}

// Validation constants synchronized verbatim with firebase-blueprint.json
export const BLUEPRINT_CONSTRAINTS = {
  ID_REGEX: /^[a-zA-Z0-9_\-]+$/,
  ID_MAX_LENGTH: 128,
  HOSTEL_NAME_MAX: 120,
  ADDRESS_MAX: 250,
  PHONE_MIN: 7,
  PHONE_MAX: 25,
  EMAIL_MAX: 120,
  OPENING_HOURS_MAX: 160,
  ABOUT_HEADING_MAX: 140,
  ABOUT_DESC_MAX: 1500,
  ADMISSION_REQ_MAX: 1500,
  PHOTO_URL_MAX: 350000,
  FACILITY_NAME_MAX: 80,
  FACILITY_DESC_MAX: 400,
  ROOM_NAME_MAX: 100,
  ROOM_OCCUPANCY_MAX: 100,
  ROOM_PRICE_MAX: 120,
  ROOM_DEPOSIT_MAX: 120,
  ROOM_FACILITIES_MAX: 400,
  ROOM_ALT_MAX: 200,
  GALLERY_TITLE_MAX: 120,
  GALLERY_ALT_MAX: 240,
  FAQ_QUESTION_MAX: 240,
  FAQ_ANSWER_MAX: 1200,
  ENQUIRY_NAME_MIN: 2,
  ENQUIRY_NAME_MAX: 100,
  ENQUIRY_MESSAGE_MAX: 1000,
  ENQUIRY_ADMIN_NOTES_MAX: 500,
} as const;

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, BLUEPRINT_CONSTRAINTS.ID_MAX_LENGTH);
  return cleaned.length > 0 ? cleaned : 'doc_1';
}

export function truncateString(val: string, maxLen: number): string {
  return (val || '').trim().slice(0, maxLen);
}
