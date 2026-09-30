import { createClient } from '@supabase/supabase-js';
import { EnquiryItem } from '../types';

const SUPABASE_PROJECT_ID =
  import.meta.env.VITE_SUPABASE_PROJECT_ID || 'zcrcrcwmrobfdofaevwl';
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_nchuSGlC849WgSXxbVMwTQ_j5knXJMG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Automatically saves newly submitted appointment / accommodation enquiries
 * to the user's Supabase database (project: zcrcrcwmrobfdofaevwl).
 */
export async function saveEnquiryToSupabase(enquiry: EnquiryItem): Promise<boolean> {
  const rowPayload = {
    reference_number: enquiry.referenceNumber,
    requirement_type: enquiry.requirementType,
    full_name: enquiry.fullName,
    phone: enquiry.phone,
    email: enquiry.email,
    student_name: enquiry.studentName,
    preferred_move_in_date: enquiry.preferredMoveInDate || null,
    occupants_count: enquiry.occupantsCount,
    preferred_room_type: enquiry.preferredRoomType,
    preferred_visit_date: enquiry.preferredVisitDate || null,
    preferred_time_slot: enquiry.preferredTimeSlot,
    message: enquiry.message,
    consent_given: enquiry.consentGiven,
    status: enquiry.status,
    created_at: enquiry.createdAtIso,
  };

  // Attempt standard table names used in Supabase appointment/enquiry setups
  const candidateTables = ['appointments', 'enquiries', 'bookings'];

  for (const tableName of candidateTables) {
    try {
      const { error } = await supabase.from(tableName).insert([rowPayload]);
      if (!error) {
        return true;
      }
    } catch {
      // Continue to next candidate table if not found
    }
  }

  return false;
}
