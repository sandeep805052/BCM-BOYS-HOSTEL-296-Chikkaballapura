import { db } from './index.ts';
import { users, enquiries } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database user upsert failed:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export interface CreateEnquiryInput {
  docId: string;
  referenceNumber: string;
  userUid: string;
  requirementType: string;
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
  status: string;
  adminNotes: string;
}

export async function upsertEnquiryRecord(input: CreateEnquiryInput) {
  try {
    const result = await db
      .insert(enquiries)
      .values({
        docId: input.docId,
        referenceNumber: input.referenceNumber,
        userUid: input.userUid,
        requirementType: input.requirementType,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        studentName: input.studentName,
        preferredMoveInDate: input.preferredMoveInDate,
        occupantsCount: input.occupantsCount,
        preferredRoomType: input.preferredRoomType,
        preferredVisitDate: input.preferredVisitDate,
        preferredTimeSlot: input.preferredTimeSlot,
        message: input.message,
        consentGiven: input.consentGiven,
        status: input.status,
        adminNotes: input.adminNotes,
      })
      .onConflictDoUpdate({
        target: enquiries.docId,
        set: {
          status: input.status,
          adminNotes: input.adminNotes,
          preferredVisitDate: input.preferredVisitDate,
          preferredTimeSlot: input.preferredTimeSlot,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database enquiry insert failed:', error);
    throw new Error('Failed to save enquiry to relational database.', { cause: error });
  }
}

export async function listEnquiriesFromDb(userUid: string, isAdminUser: boolean) {
  try {
    if (isAdminUser) {
      return await db.select().from(enquiries).orderBy(desc(enquiries.createdAt));
    }
    return await db
      .select()
      .from(enquiries)
      .where(eq(enquiries.userUid, userUid))
      .orderBy(desc(enquiries.createdAt));
  } catch (error) {
    console.error('Database enquiry list failed:', error);
    throw new Error('Failed to load enquiries from relational database.', { cause: error });
  }
}
