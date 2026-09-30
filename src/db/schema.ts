import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const enquiries = pgTable('enquiries', {
  id: serial('id').primaryKey(),
  docId: text('doc_id').notNull().unique(),
  referenceNumber: text('reference_number').notNull(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  requirementType: text('requirement_type').notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  studentName: text('student_name').notNull(),
  preferredMoveInDate: text('preferred_move_in_date').notNull(),
  occupantsCount: integer('occupants_count').notNull(),
  preferredRoomType: text('preferred_room_type').notNull(),
  preferredVisitDate: text('preferred_visit_date').notNull(),
  preferredTimeSlot: text('preferred_time_slot').notNull(),
  message: text('message').notNull(),
  consentGiven: boolean('consent_given').notNull(),
  status: text('status').notNull(),
  adminNotes: text('admin_notes').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  enquiries: many(enquiries),
}));

export const enquiriesRelations = relations(enquiries, ({ one }) => ({
  submitter: one(users, {
    fields: [enquiries.userUid],
    references: [users.uid],
  }),
}));
