# Phase 0: Payload-First Security TDD Specification — BCM BOYS HOSTEL 296

## 1. Data Invariants

1. **Authentication & Verification Gate**: Every Firestore read and write requires `request.auth != null && request.auth.token.email_verified == true`.
2. **Bootstrapped & Trusted Admin Verification**: Administrator status (`isAdmin()`) requires `isVerifiedUser()` AND either the verified runtime admin email (`request.auth.token.email == 'sandeepssreddy54@gmail.com'`) or an existing record at `/admins/$(request.auth.uid)`.
3. **Path Variable Hardening**: Every single-document operation (`get`, `create`, `update`, `delete`) validates its path ID variable with `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
4. **Strict Blueprint Schema Enforcement**: Every `create` and `update` invokes `isValid[Entity](incoming())` checking exact key sets (`hasAll` and `hasOnly`), field types, string `.size()` boundaries, array `.size()` and element checks, and regex guards.
5. **PII Isolation (`enquiries`)**: Applicant PII (`fullName`, `phone`, `email`, `studentName`, `message`) in `/enquiries/{enquiryId}` is strictly isolated. Only the original submitter (`resource.data.submitterUid == request.auth.uid`) or a verified administrator (`isAdmin()`) may `get` or `list` enquiry records.
6. **Temporal & Identity Integrity**: `createdAt` and `updatedAt` must equal `request.time`. On `enquiries`, `submitterUid` must equal `request.auth.uid` on creation and remain immutable on update (`incoming().submitterUid == existing().submitterUid`).
7. **Terminal State Locking**: Once an enquiry reaches `status == 'Completed'` or `status == 'Cancelled'`, non-admin users cannot update it (`!(existing().status in ['Completed', 'Cancelled']) || isAdmin()`).
8. **Secure List Queries**: Every `allow list` rule evaluates `resource.data` directly (`resource.data.hostelId == 'bcm-296'` for public catalog collections, and `resource.data.submitterUid == request.auth.uid || (isAdmin() && resource.data.hostelId == 'bcm-296')` for `enquiries`).

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 — Unverified Email Admin Spoof**:
   `auth: { uid: 'attacker1', token: { email: 'sandeepssreddy54@gmail.com', email_verified: false } }` attempting to update `/siteConfig/main`.
2. **Payload 2 — Self-Assigned Admin Privilege Escalation**:
   `auth: { uid: 'user2', token: { email: 'student@example.com', email_verified: true } }` attempting to create `/admins/user2` with `{ uid: 'user2', email: 'student@example.com', role: 'admin' }`.
3. **Payload 3 — Shadow Field Injection on Enquiry Create**:
   Adding `{ ..., isApprovedByAdmin: true }` to `/enquiries/enq_01`. Rejected by `hasOnly()`.
4. **Payload 4 — Identity Spoofing on Enquiry Create**:
   Setting `submitterUid: 'victim_uid'` when `request.auth.uid == 'attacker_uid'`.
5. **Payload 5 — PII Blanket Read / Horizontal Privilege Escalation**:
   Authenticated user `uid: 'user_b'` attempting `get(/enquiries/enq_owned_by_user_a)`.
6. **Payload 6 — Unauthorized Query Scraping (`list` on `enquiries`)**:
   Authenticated non-admin user executing an unfiltered `list` on `/enquiries` without matching `resource.data.submitterUid == request.auth.uid`.
7. **Payload 7 — Resource Poisoning / 1.5KB Document ID**:
   Creating `/enquiries/<200_char_id>` or injecting `$invalid$id!`. Blocked by `isValidId()`.
8. **Payload 8 — Denial of Wallet / 1MB String Payload**:
   Sending `message` with 5,000 characters on `/enquiries/enq_02` (exceeds `maxLength: 1000`).
9. **Payload 9 — Unbounded Array Injection on `siteConfig`**:
   Sending `availableTimeSlots` with 50 items (exceeds max 16) or non-string first element.
10. **Payload 10 — Timestamp Forgery**:
    Sending a backdated `createdAt` or `updatedAt` != `request.time`.
11. **Payload 11 — Immortal Field Mutation**:
    Attempting to mutate `createdAt`, `referenceNumber`, or `submitterUid` during an update on `/enquiries/{enquiryId}`.
12. **Payload 12 — Terminal State Bypass**:
    Attempting to update an enquiry whose `existing().status == 'Completed'` as a non-admin user.
