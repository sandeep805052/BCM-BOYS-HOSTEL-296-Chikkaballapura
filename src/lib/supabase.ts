import { createClient } from '@supabase/supabase-js';
import { EnquiryItem, EnquiryStatus, RequirementType } from '../types';

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

/**
 * Subscribes to Supabase Realtime WebSocket events on the `appointments` table
 * so new or updated bookings stream live into the application.
 */
export function subscribeToSupabaseAppointments(
  onRecordReceived: (item: EnquiryItem) => void
): () => void {
  const channel = supabase
    .channel('bcm296-appointments-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'appointments' },
      (payload) => {
        const row = (payload.new || {}) as Record<string, unknown>;
        const referenceNumber = String(row.reference_number || '');
        if (!referenceNumber) return;

        const mapped: EnquiryItem = {
          id: `supa_${referenceNumber.replace(/[^a-zA-Z0-9_\-]/g, '_')}`,
          hostelId: 'bcm-296',
          referenceNumber,
          submitterUid: 'supabase_realtime',
          requirementType:
            (row.requirement_type as RequirementType) || 'Accommodation enquiry',
          fullName: String(row.full_name || ''),
          phone: String(row.phone || ''),
          email: String(row.email || ''),
          studentName: String(row.student_name || ''),
          preferredMoveInDate: String(row.preferred_move_in_date || ''),
          occupantsCount: Number(row.occupants_count || 1),
          preferredRoomType: String(row.preferred_room_type || ''),
          preferredVisitDate: String(row.preferred_visit_date || ''),
          preferredTimeSlot: String(row.preferred_time_slot || ''),
          message: String(row.message || ''),
          consentGiven: Boolean(row.consent_given ?? true),
          status: (row.status as EnquiryStatus) || 'New',
          adminNotes: String(row.admin_notes || ''),
          createdAtIso: String(row.created_at || new Date().toISOString()),
          syncedToCloud: true,
        };

        onRecordReceived(mapped);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
