import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  HelpCircle,
  Image as ImageIcon,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  BedDouble,
  Sliders,
} from 'lucide-react';
import { useHostel, compressImageFile } from '../context/HostelContext';
import {
  EnquiryStatus,
  RoomAvailabilityStatus,
  GalleryCategory,
  RoomItem,
  FacilityItem,
  GalleryItem,
  FaqItem,
} from '../types';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../firebase';

interface AdminDashboardProps {
  onExitAdmin: () => void;
  initialTab?: 'enquiries' | 'schedule' | 'rooms' | 'facilities' | 'gallery' | 'settings';
}

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ALL_STATUSES: EnquiryStatus[] = [
  'New',
  'Pending',
  'Confirmed',
  'Rescheduled',
  'Completed',
  'Cancelled',
];
const GALLERY_CATEGORIES: GalleryCategory[] = [
  'Exterior',
  'Rooms',
  'Study Areas',
  'Dining',
  'Common Areas',
  'Facilities',
  'Surroundings',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onExitAdmin,
  initialTab = 'enquiries',
}) => {
  const {
    user,
    isAdmin,
    siteConfig,
    facilities,
    rooms,
    gallery,
    faqs,
    enquiries,
    signInWithGoogle,
    signOutUser,
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
  } = useHostel();

  const [activeTab, setActiveTab] = useState<
    'enquiries' | 'schedule' | 'rooms' | 'facilities' | 'gallery' | 'settings'
  >(initialTab);

  // Enquiries state
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingEnquiryId, setEditingEnquiryId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<EnquiryStatus>('Pending');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editVisitDate, setEditVisitDate] = useState<string>('');
  const [editTimeSlot, setEditTimeSlot] = useState<string>('');

  // Schedule state
  const [newTimeSlot, setNewTimeSlot] = useState<string>('');
  const [newBlockedDate, setNewBlockedDate] = useState<string>('');

  // Room form state
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [newRoomOccupancy, setNewRoomOccupancy] = useState<string>(
    'Confirm occupancy with management'
  );
  const [newRoomPrice, setNewRoomPrice] = useState<string>(
    'Contact for Room Details & Availability'
  );
  const [newRoomDeposit, setNewRoomDeposit] = useState<string>('Confirm with management');
  const [newRoomFacilities, setNewRoomFacilities] = useState<string>(
    'Contact management for verified room furnishings'
  );

  // Facility form state
  const [newFacName, setNewFacName] = useState<string>('');
  const [newFacDesc, setNewFacDesc] = useState<string>(
    'Contact management to confirm availability and specifications.'
  );

  // Gallery upload state
  const [newGalTitle, setNewGalTitle] = useState<string>('');
  const [newGalCategory, setNewGalCategory] = useState<GalleryCategory>('Exterior');
  const [newGalAlt, setNewGalAlt] = useState<string>('');
  const [newGalUrl, setNewGalUrl] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  // FAQ form state
  const [newFaqQuestion, setNewFaqQuestion] = useState<string>('');
  const [newFaqAnswer, setNewFaqAnswer] = useState<string>(
    'Please contact hostel management for the latest information.'
  );
  const [newFaqVerified, setNewFaqVerified] = useState<boolean>(false);

  // Settings local draft
  const [configDraft, setConfigDraft] = useState(siteConfig);
  const [saveBanner, setSaveBanner] = useState<string>('');

  React.useEffect(() => {
    setConfigDraft(siteConfig);
  }, [siteConfig]);

  const showFeedback = (msg: string) => {
    setSaveBanner(msg);
    setTimeout(() => setSaveBanner(''), 3000);
  };

  // Filtered enquiries
  const filteredEnquiries = enquiries.filter((enq) => {
    const matchesStatus = statusFilter === 'All' || enq.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      enq.fullName.toLowerCase().includes(q) ||
      enq.phone.toLowerCase().includes(q) ||
      enq.referenceNumber.toLowerCase().includes(q) ||
      enq.studentName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Basic Analytics
  const analytics = {
    total: enquiries.length,
    newOrPending: enquiries.filter((e) => e.status === 'New' || e.status === 'Pending').length,
    confirmed: enquiries.filter((e) => e.status === 'Confirmed' || e.status === 'Rescheduled')
      .length,
    completed: enquiries.filter((e) => e.status === 'Completed').length,
  };

  const handleFileUpload = async (
    file: File,
    onResult: (dataUrl: string) => void
  ): Promise<void> => {
    setUploadingPhoto(true);
    try {
      const compressed = await compressImageFile(file, 1100, 0.76);
      onResult(compressed);
      showFeedback('Photograph processed and ready.');
    } catch {
      showFeedback('Could not process image file.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#243447]">
      {/* Top Bar Contract for SaaS/Admin Workspace */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#102A43]/12 bg-white px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExitAdmin}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#102A43]/15 bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#102A43] hover:bg-[#E8F0F7] whitespace-nowrap"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Public Website</span>
          </button>
          <span aria-hidden="true" className="text-[#243447]/30">/</span>
          <span className="text-sm font-semibold text-[#102A43] truncate">
            BCM BOYS HOSTEL 296 · Management Console
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 text-xs">
              <span className="hidden text-[#243447] sm:inline">
                {user.email} · {isAdmin ? 'Verified Admin' : 'Viewer'}
              </span>
              <button
                type="button"
                onClick={signOutUser}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#102A43]/15 px-3 py-1.5 font-medium text-[#102A43] hover:bg-[#E8F0F7] whitespace-nowrap"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#102A43] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1769AA] whitespace-nowrap"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Sign In with Google (Cloud Sync)</span>
            </button>
          )}
        </div>
      </header>

      {/* Auth Notice Banner if not signed in as Bootstrapped Admin */}
      {!isAdmin && (
        <div className="border-b border-[#1769AA]/20 bg-[#E8F0F7] px-4 py-3 text-xs text-[#102A43] sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <span>
              <strong>Preview & Local Management Mode:</strong> Changes made here update your browser
              preview immediately. To persist changes to the live cloud database, sign in with the
              authorized administrator Google account ({BOOTSTRAPPED_ADMIN_EMAIL}).
            </span>
            {!user && (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="self-start rounded-md bg-[#102A43] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1769AA] sm:self-auto whitespace-nowrap"
              >
                Admin Sign In
              </button>
            )}
          </div>
        </div>
      )}

      {/* Save Feedback Toast */}
      {saveBanner && (
        <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg bg-[#102A43] px-4 py-3 text-xs font-semibold text-white shadow-md">
          <CheckCircle2 className="h-4 w-4 text-[#2E7D5B]" />
          <span>{saveBanner}</span>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        {/* Workspace Sidebar Navigation (240px-280px on desktop) */}
        <aside className="w-full shrink-0 border-b border-[#102A43]/10 bg-white p-4 lg:min-h-[calc(100vh-57px)] lg:w-64 lg:border-r lg:border-b-0">
          <nav aria-label="Admin sections" className="flex gap-1.5 overflow-x-auto lg:flex-col">
            {[
              {
                id: 'enquiries',
                label: 'Enquiries & Visits',
                icon: ClipboardList,
                count: enquiries.length,
              },
              {
                id: 'schedule',
                label: 'Days & Time Slots',
                icon: Calendar,
                count: siteConfig.availableTimeSlots.length,
              },
              {
                id: 'rooms',
                label: 'Rooms & Pricing',
                icon: BedDouble,
                count: rooms.length,
              },
              {
                id: 'facilities',
                label: 'Facilities CMS',
                icon: Sliders,
                count: facilities.length,
              },
              {
                id: 'gallery',
                label: 'Property Gallery',
                icon: ImageIcon,
                count: gallery.length,
              },
              {
                id: 'settings',
                label: 'Contact & FAQs',
                icon: Settings,
                count: faqs.length,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      tab.id as
                        | 'enquiries'
                        | 'schedule'
                        | 'rooms'
                        | 'facilities'
                        | 'gallery'
                        | 'settings'
                    )
                  }
                  className={`flex items-center justify-between gap-2 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors duration-150 whitespace-nowrap ${
                    active
                      ? 'bg-[#102A43] text-white'
                      : 'text-[#243447] hover:bg-[#E8F0F7]/70 hover:text-[#102A43]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{tab.label}</span>
                  </span>
                  <span className="font-mono-tabular text-xs opacity-80">{tab.count}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* TAB 1: ENQUIRIES & APPOINTMENTS */}
          {activeTab === 'enquiries' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-normal text-[#102A43]">
                  Enquiries & Visit Appointments
                </h1>
                <p className="mt-1 text-xs text-[#243447]/80">
                  Review incoming accommodation requests, approve or reschedule hostel visits, and
                  update status workflows.
                </p>
              </div>

              {/* Analytics Bar (Tabular Numerals, Single Elevation) */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#102A43]/12 bg-white p-4 sm:grid-cols-4">
                <div className="border-r border-[#102A43]/10 pr-4">
                  <p className="text-xs text-[#243447]/70">Total Enquiries</p>
                  <p className="font-mono-tabular mt-1 text-2xl font-semibold text-[#102A43]">
                    {analytics.total}
                  </p>
                </div>
                <div className="sm:border-r sm:border-[#102A43]/10 sm:pr-4">
                  <p className="text-xs text-[#243447]/70">New / Pending Review</p>
                  <p className="font-mono-tabular mt-1 text-2xl font-semibold text-[#1769AA]">
                    {analytics.newOrPending}
                  </p>
                </div>
                <div className="border-r border-[#102A43]/10 pr-4">
                  <p className="text-xs text-[#243447]/70">Confirmed / Scheduled</p>
                  <p className="font-mono-tabular mt-1 text-2xl font-semibold text-[#2E7D5B]">
                    {analytics.confirmed}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#243447]/70">Completed Visits</p>
                  <p className="font-mono-tabular mt-1 text-2xl font-semibold text-[#243447]">
                    {analytics.completed}
                  </p>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#102A43]/12 bg-white p-1">
                  {(['All', ...ALL_STATUSES] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        statusFilter === st
                          ? 'bg-[#102A43] text-white'
                          : 'text-[#243447] hover:text-[#102A43]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <input
                  type="search"
                  placeholder="Search name, phone, or reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2 text-xs text-[#102A43] sm:w-64"
                />
              </div>

              {/* Enquiries Table / List */}
              {filteredEnquiries.length === 0 ? (
                <div className="rounded-xl border border-[#102A43]/12 bg-white p-8 text-center">
                  <p className="text-sm font-semibold text-[#102A43]">
                    No enquiries match the current filter
                  </p>
                  <p className="mt-1 text-xs text-[#243447]/75">
                    When students or parents submit an accommodation enquiry or visit request, it
                    will appear here immediately.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#102A43]/12 bg-white">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#102A43]/12 bg-[#F8FAFC] text-[#102A43]">
                        <th className="py-3 px-4 font-semibold">Ref & Date</th>
                        <th className="py-3 px-4 font-semibold">Applicant / Student</th>
                        <th className="py-3 px-4 font-semibold">Requirement & Room</th>
                        <th className="py-3 px-4 font-semibold">Requested Visit Slot</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#102A43]/10">
                      {filteredEnquiries.map((enq) => {
                        const isEditing = editingEnquiryId === enq.id;
                        return (
                          <React.Fragment key={enq.id}>
                            <tr className="hover:bg-[#F8FAFC]">
                              <td className="py-3.5 px-4 align-top">
                                <p className="font-mono-tabular font-semibold text-[#102A43]">
                                  {enq.referenceNumber}
                                </p>
                                <p className="font-mono-tabular mt-0.5 text-[#243447]/70">
                                  {enq.createdAtIso.slice(0, 10)}
                                </p>
                              </td>
                              <td className="py-3.5 px-4 align-top">
                                <p className="font-semibold text-[#102A43]">{enq.fullName}</p>
                                <p className="font-mono-tabular mt-0.5 text-[#1769AA]">
                                  {enq.phone}
                                </p>
                                {enq.studentName && enq.studentName !== enq.fullName && (
                                  <p className="mt-0.5 text-[#243447]/75">
                                    Student: {enq.studentName}
                                  </p>
                                )}
                              </td>
                              <td className="py-3.5 px-4 align-top">
                                <p className="font-medium text-[#102A43]">{enq.requirementType}</p>
                                <p className="mt-0.5 text-[#243447]/75">
                                  {enq.preferredRoomType} ·{' '}
                                  <span className="font-mono-tabular">{enq.occupantsCount}</span>{' '}
                                  pax
                                </p>
                                {enq.message && (
                                  <p className="mt-1 max-w-xs text-[#243447]/80 italic">
                                    "{enq.message}"
                                  </p>
                                )}
                              </td>
                              <td className="py-3.5 px-4 align-top">
                                <p className="font-mono-tabular font-medium text-[#102A43]">
                                  {enq.preferredVisitDate || 'Not specified'}
                                </p>
                                <p className="font-mono-tabular mt-0.5 text-[#243447]/75">
                                  {enq.preferredTimeSlot}
                                </p>
                              </td>
                              <td className="py-3.5 px-4 align-top">
                                <span className="font-semibold text-[#102A43]">{enq.status}</span>
                                {enq.adminNotes && (
                                  <p className="mt-0.5 max-w-[180px] text-[#243447]/75">
                                    Note: {enq.adminNotes}
                                  </p>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right align-top">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateEnquiryAdmin(enq.id, {
                                        status: 'Confirmed',
                                        adminNotes: enq.adminNotes || 'Visit confirmed by staff.',
                                        preferredVisitDate: enq.preferredVisitDate,
                                        preferredTimeSlot: enq.preferredTimeSlot,
                                      });
                                      showFeedback(`Enquiry ${enq.referenceNumber} confirmed.`);
                                    }}
                                    className="rounded-md bg-[#2E7D5B] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#2E7D5B]/90 whitespace-nowrap"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isEditing) {
                                        setEditingEnquiryId(null);
                                      } else {
                                        setEditingEnquiryId(enq.id);
                                        setEditStatus(enq.status);
                                        setEditNotes(enq.adminNotes);
                                        setEditVisitDate(enq.preferredVisitDate);
                                        setEditTimeSlot(enq.preferredTimeSlot);
                                      }
                                    }}
                                    className="rounded-md border border-[#102A43]/20 bg-white px-2.5 py-1 text-xs font-medium text-[#102A43] hover:bg-[#E8F0F7] whitespace-nowrap"
                                  >
                                    {isEditing ? 'Close' : 'Manage'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      deleteEnquiryAdmin(enq.id);
                                      showFeedback('Enquiry deleted.');
                                    }}
                                    aria-label={`Delete enquiry ${enq.referenceNumber}`}
                                    className="rounded-md p-1 text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {isEditing && (
                              <tr className="bg-[#E8F0F7]/40">
                                <td colSpan={6} className="p-4">
                                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                    <div>
                                      <label className="block text-xs font-semibold text-[#102A43]">
                                        Change Status
                                      </label>
                                      <select
                                        value={editStatus}
                                        onChange={(e) =>
                                          setEditStatus(e.target.value as EnquiryStatus)
                                        }
                                        className="mt-1 w-full rounded-lg border border-[#102A43]/20 bg-white px-3 py-1.5 text-xs text-[#102A43]"
                                      >
                                        {ALL_STATUSES.map((st) => (
                                          <option key={st} value={st}>
                                            {st}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-[#102A43]">
                                        Visit Date
                                      </label>
                                      <input
                                        type="date"
                                        value={editVisitDate}
                                        onChange={(e) => setEditVisitDate(e.target.value)}
                                        className="font-mono-tabular mt-1 w-full rounded-lg border border-[#102A43]/20 bg-white px-3 py-1.5 text-xs text-[#102A43]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-[#102A43]">
                                        Visit Time Slot
                                      </label>
                                      <input
                                        type="text"
                                        value={editTimeSlot}
                                        onChange={(e) => setEditTimeSlot(e.target.value)}
                                        className="font-mono-tabular mt-1 w-full rounded-lg border border-[#102A43]/20 bg-white px-3 py-1.5 text-xs text-[#102A43]"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-[#102A43]">
                                        Staff Remarks / Notes
                                      </label>
                                      <input
                                        type="text"
                                        value={editNotes}
                                        placeholder="Add note..."
                                        onChange={(e) => setEditNotes(e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-[#102A43]/20 bg-white px-3 py-1.5 text-xs text-[#102A43]"
                                      />
                                    </div>
                                  </div>
                                  <div className="mt-3 flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateEnquiryAdmin(enq.id, {
                                          status: 'Cancelled',
                                          adminNotes: editNotes || 'Rejected/Cancelled by staff.',
                                          preferredVisitDate: editVisitDate,
                                          preferredTimeSlot: editTimeSlot,
                                        });
                                        setEditingEnquiryId(null);
                                        showFeedback('Appointment rejected/cancelled.');
                                      }}
                                      className="rounded-lg border border-red-700/30 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                                    >
                                      Reject Request
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateEnquiryAdmin(enq.id, {
                                          status: editStatus,
                                          adminNotes: editNotes,
                                          preferredVisitDate: editVisitDate,
                                          preferredTimeSlot: editTimeSlot,
                                        });
                                        setEditingEnquiryId(null);
                                        showFeedback('Appointment updated.');
                                      }}
                                      className="rounded-lg bg-[#102A43] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#1769AA]"
                                    >
                                      Save Changes
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SCHEDULE & TIME SLOTS */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-normal text-[#102A43]">
                  Configure Available Days, Time Slots & Blocked Dates
                </h1>
                <p className="mt-1 text-xs text-[#243447]/80">
                  Control which days and time slots visitors can choose in the Step 2 & Step 3
                  booking calendar.
                </p>
              </div>

              {/* Available Days of the Week */}
              <div className="rounded-xl border border-[#102A43]/12 bg-white p-6">
                <h2 className="text-base font-semibold text-[#102A43]">
                  Available Visiting Days of the Week
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => {
                    const active = siteConfig.availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const nextDays = active
                            ? siteConfig.availableDays.filter((d) => d !== day)
                            : [...siteConfig.availableDays, day];
                          saveSiteConfig({ ...siteConfig, availableDays: nextDays });
                          showFeedback(`Updated visiting days.`);
                        }}
                        className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                          active
                            ? 'border-[#102A43] bg-[#102A43] text-white'
                            : 'border-[#102A43]/20 bg-[#F8FAFC] text-[#243447]'
                        }`}
                      >
                        {day} {active ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Time Slots */}
              <div className="rounded-xl border border-[#102A43]/12 bg-white p-6">
                <h2 className="text-base font-semibold text-[#102A43]">
                  Configured Visiting Time Slots
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {siteConfig.availableTimeSlots.map((slot) => (
                    <div
                      key={slot}
                      className="flex items-center gap-2 rounded-lg border border-[#102A43]/15 bg-[#F8FAFC] px-3 py-1.5 text-xs"
                    >
                      <span className="font-mono-tabular font-medium text-[#102A43]">{slot}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = siteConfig.availableTimeSlots.filter((s) => s !== slot);
                          saveSiteConfig({ ...siteConfig, availableTimeSlots: next });
                          showFeedback('Removed time slot.');
                        }}
                        className="text-red-700 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex max-w-md gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 05:00 PM - 06:00 PM"
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    className="font-mono-tabular flex-1 rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newTimeSlot.trim()) return;
                      saveSiteConfig({
                        ...siteConfig,
                        availableTimeSlots: [...siteConfig.availableTimeSlots, newTimeSlot.trim()],
                      });
                      setNewTimeSlot('');
                      showFeedback('Added time slot.');
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#102A43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1769AA] whitespace-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Slot</span>
                  </button>
                </div>
              </div>

              {/* Block Specific Unavailable Dates */}
              <div className="rounded-xl border border-[#102A43]/12 bg-white p-6">
                <h2 className="text-base font-semibold text-[#102A43]">
                  Blocked / Holiday Dates
                </h2>
                <p className="mt-1 text-xs text-[#243447]/75">
                  Block specific dates so visitors cannot schedule appointments on those days.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {siteConfig.blockedDates.length === 0 ? (
                    <span className="text-xs text-[#243447]/60">No dates currently blocked.</span>
                  ) : (
                    siteConfig.blockedDates.map((dt) => (
                      <div
                        key={dt}
                        className="flex items-center gap-2 rounded-lg border border-red-800/20 bg-red-50 px-3 py-1.5 text-xs text-red-950"
                      >
                        <span className="font-mono-tabular font-medium">{dt}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = siteConfig.blockedDates.filter((d) => d !== dt);
                            saveSiteConfig({ ...siteConfig, blockedDates: next });
                            showFeedback('Date unblocked.');
                          }}
                          className="font-semibold text-red-700 hover:underline"
                        >
                          Unblock
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex max-w-md gap-2">
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={newBlockedDate}
                    onChange={(e) => setNewBlockedDate(e.target.value)}
                    className="font-mono-tabular flex-1 rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newBlockedDate) return;
                      if (!siteConfig.blockedDates.includes(newBlockedDate)) {
                        saveSiteConfig({
                          ...siteConfig,
                          blockedDates: [...siteConfig.blockedDates, newBlockedDate],
                        });
                        showFeedback(`Blocked ${newBlockedDate}.`);
                      }
                      setNewBlockedDate('');
                    }}
                    className="rounded-lg bg-[#102A43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1769AA] whitespace-nowrap"
                  >
                    Block Date
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROOMS & PRICING */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-normal text-[#102A43]">
                  Manage Rooms, Availability & Pricing
                </h1>
                <p className="mt-1 text-xs text-[#243447]/80">
                  Update room availability, verified prices, deposits, and real room photographs.
                </p>
              </div>

              <div className="space-y-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="rounded-xl border border-[#102A43]/12 bg-white p-5"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#102A43]">
                          Room Category Name
                        </label>
                        <input
                          type="text"
                          value={room.name}
                          onChange={(e) => saveRoom({ ...room, name: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-[#102A43]/20 px-3 py-1.5 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#102A43]">
                          Occupancy Details
                        </label>
                        <input
                          type="text"
                          value={room.occupancy}
                          onChange={(e) => saveRoom({ ...room, occupancy: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-[#102A43]/20 px-3 py-1.5 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#102A43]">
                          Availability Status
                        </label>
                        <select
                          value={room.status}
                          onChange={(e) =>
                            saveRoom({
                              ...room,
                              status: e.target.value as RoomAvailabilityStatus,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-[#102A43]/20 bg-white px-3 py-1.5 text-xs"
                        >
                          <option value="Contact for Availability">Contact for Availability</option>
                          <option value="Available">Available</option>
                          <option value="Unavailable">Unavailable</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#102A43]">
                          Price / Fee Text
                        </label>
                        <input
                          type="text"
                          value={room.priceText}
                          onChange={(e) => saveRoom({ ...room, priceText: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-[#102A43]/20 px-3 py-1.5 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#102A43]">
                          Deposit Text
                        </label>
                        <input
                          type="text"
                          value={room.depositText}
                          onChange={(e) => saveRoom({ ...room, depositText: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-[#102A43]/20 px-3 py-1.5 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#102A43]">
                          Room Facilities Description
                        </label>
                        <input
                          type="text"
                          value={room.facilitiesText}
                          onChange={(e) => saveRoom({ ...room, facilitiesText: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-[#102A43]/20 px-3 py-1.5 text-xs"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#102A43]/10 pt-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#102A43]">
                          <input
                            type="checkbox"
                            checked={room.verified}
                            onChange={(e) => {
                              saveRoom({ ...room, verified: e.target.checked });
                              showFeedback('Room verification status updated.');
                            }}
                          />
                          <span>Mark Room Details as Management Verified</span>
                        </label>

                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#102A43]/20 bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#102A43] hover:bg-[#E8F0F7]">
                          <Upload className="h-3.5 w-3.5" />
                          <span>{room.photoUrl ? 'Replace Room Photo' : 'Upload Room Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, (dataUrl) => {
                                  saveRoom({ ...room, photoUrl: dataUrl });
                                });
                              }
                            }}
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          deleteRoom(room.id);
                          showFeedback('Room category removed.');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove Room</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Room Card */}
              <div className="rounded-xl border border-[#102A43]/12 bg-white p-6">
                <h2 className="text-base font-semibold text-[#102A43]">Add New Room Category</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Room Name (e.g. 3-Sharing Student Room)"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Occupancy"
                    value={newRoomOccupancy}
                    onChange={(e) => setNewRoomOccupancy(e.target.value)}
                    className="rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Price Text"
                    value={newRoomPrice}
                    onChange={(e) => setNewRoomPrice(e.target.value)}
                    className="rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Deposit Text"
                    value={newRoomDeposit}
                    onChange={(e) => setNewRoomDeposit(e.target.value)}
                    className="rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Facilities summary"
                    value={newRoomFacilities}
                    onChange={(e) => setNewRoomFacilities(e.target.value)}
                    className="rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs sm:col-span-2"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newRoomName.trim()) return;
                    const newRoom: RoomItem = {
                      id: `room_${Date.now()}`,
                      hostelId: 'bcm-296',
                      name: newRoomName.trim(),
                      occupancy: newRoomOccupancy.trim(),
                      status: 'Contact for Availability',
                      priceText: newRoomPrice.trim(),
                      depositText: newRoomDeposit.trim(),
                      facilitiesText: newRoomFacilities.trim(),
                      photoUrl: '',
                      photoAlt: `${newRoomName.trim()} at BCM BOYS HOSTEL 296`,
                      verified: false,
                      order: rooms.length + 1,
                      updatedBy: user?.uid || 'local_admin',
                    };
                    saveRoom(newRoom);
                    setNewRoomName('');
                    showFeedback('Added new room category.');
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#102A43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1769AA]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Room Option</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: FACILITIES CMS */}
          {activeTab === 'facilities' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-normal text-[#102A43]">
                  Facilities & Verification Controls
                </h1>
                <p className="mt-1 text-xs text-[#243447]/80">
                  Unverified facilities automatically display as "Confirm with management" on the
                  website. Only mark a facility as Verified if it is actively provided on-site.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {facilities.map((fac) => (
                  <div
                    key={fac.id}
                    className="flex flex-col justify-between rounded-xl border border-[#102A43]/12 bg-white p-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={fac.name}
                          onChange={(e) => saveFacility({ ...fac, name: e.target.value })}
                          className="w-full rounded-lg border border-[#102A43]/20 px-3 py-1.5 text-xs font-semibold text-[#102A43]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            deleteFacility(fac.id);
                            showFeedback('Facility deleted.');
                          }}
                          aria-label={`Delete ${fac.name}`}
                          className="p-1 text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={fac.description}
                        onChange={(e) => saveFacility({ ...fac, description: e.target.value })}
                        className="w-full rounded-lg border border-[#102A43]/20 px-3 py-1.5 text-xs text-[#243447]"
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#102A43]/10 pt-3 text-xs">
                      <label className="flex cursor-pointer items-center gap-2 font-medium text-[#102A43]">
                        <input
                          type="checkbox"
                          checked={fac.active}
                          onChange={(e) => {
                            saveFacility({ ...fac, active: e.target.checked });
                            showFeedback('Facility visibility updated.');
                          }}
                        />
                        <span>Display Card</span>
                      </label>

                      <label className="flex cursor-pointer items-center gap-2 font-semibold text-[#2E7D5B]">
                        <input
                          type="checkbox"
                          checked={fac.verified}
                          onChange={(e) => {
                            saveFacility({ ...fac, verified: e.target.checked });
                            showFeedback(
                              e.target.checked
                                ? `${fac.name} marked as Verified.`
                                : `${fac.name} marked as Confirm with Management.`
                            );
                          }}
                        />
                        <span>
                          {fac.verified ? 'Verified by Management' : 'Unverified (Confirm Notice)'}
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Facility */}
              <div className="rounded-xl border border-[#102A43]/12 bg-white p-6">
                <h2 className="text-base font-semibold text-[#102A43]">Add Facility Item</h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Facility Name"
                    value={newFacName}
                    onChange={(e) => setNewFacName(e.target.value)}
                    className="rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newFacDesc}
                    onChange={(e) => setNewFacDesc(e.target.value)}
                    className="rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newFacName.trim()) return;
                    const newItem: FacilityItem = {
                      id: `fac_${Date.now()}`,
                      hostelId: 'bcm-296',
                      name: newFacName.trim(),
                      description: newFacDesc.trim(),
                      iconName: 'CheckCircle',
                      verified: false,
                      active: true,
                      order: facilities.length + 1,
                      updatedBy: user?.uid || 'local_admin',
                    };
                    saveFacility(newItem);
                    setNewFacName('');
                    showFeedback('Facility added.');
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#102A43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1769AA]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Facility</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: GALLERY & PROPERTY PHOTOGRAPHS */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-normal text-[#102A43]">
                  Real Property Photographs & Gallery Manager
                </h1>
                <p className="mt-1 text-xs text-[#243447]/80">
                  Upload authentic photographs of BCM BOYS HOSTEL 296. Uploaded photos automatically
                  replace the architectural schematic placeholders.
                </p>
              </div>

              {/* Hero & About Section Photo Uploads */}
              <div className="rounded-xl border border-[#102A43]/12 bg-white p-6">
                <h2 className="text-base font-semibold text-[#102A43]">
                  Featured Property Photographs (Hero & About Sections)
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    {
                      label: 'Hero Section Photograph',
                      key: 'heroPhotoUrl' as const,
                      val: siteConfig.heroPhotoUrl,
                    },
                    {
                      label: 'About Primary Photograph',
                      key: 'aboutMainPhotoUrl' as const,
                      val: siteConfig.aboutMainPhotoUrl,
                    },
                    {
                      label: 'About Supporting Photograph',
                      key: 'aboutSecondaryPhotoUrl' as const,
                      val: siteConfig.aboutSecondaryPhotoUrl,
                    },
                  ].map((slot) => (
                    <div
                      key={slot.key}
                      className="flex flex-col justify-between rounded-lg border border-[#102A43]/15 bg-[#F8FAFC] p-4"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[#102A43]">{slot.label}</p>
                        <p className="mt-1 text-xs text-[#243447]/70">
                          {slot.val
                            ? 'Real photo uploaded ✓'
                            : 'Currently showing architectural placeholder'}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#102A43] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1769AA]">
                          <Upload className="h-3.5 w-3.5" />
                          <span>{uploadingPhoto ? 'Processing...' : 'Upload Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, (dataUrl) => {
                                  saveSiteConfig({ ...siteConfig, [slot.key]: dataUrl });
                                });
                              }
                            }}
                          />
                        </label>
                        {slot.val && (
                          <button
                            type="button"
                            onClick={() => {
                              saveSiteConfig({ ...siteConfig, [slot.key]: '' });
                              showFeedback('Reset to placeholder.');
                            }}
                            className="text-xs font-medium text-red-700 hover:underline"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add / Upload Gallery Item */}
              <div className="rounded-xl border border-[#102A43]/12 bg-white p-6">
                <h2 className="text-base font-semibold text-[#102A43]">
                  Upload New Gallery Photograph
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#102A43]">
                      Title / Caption
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Student Study Hall"
                      value={newGalTitle}
                      onChange={(e) => setNewGalTitle(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#102A43]">Category</label>
                    <select
                      value={newGalCategory}
                      onChange={(e) => setNewGalCategory(e.target.value as GalleryCategory)}
                      className="mt-1 w-full rounded-lg border border-[#102A43]/20 bg-white px-3 py-2 text-xs"
                    >
                      {GALLERY_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#102A43]">
                      Descriptive Alt Text (Accessibility)
                    </label>
                    <input
                      type="text"
                      placeholder="Describe the photograph for screen readers"
                      value={newGalAlt}
                      onChange={(e) => setNewGalAlt(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#102A43]/20 bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#102A43] hover:bg-[#E8F0F7]">
                    <Upload className="h-3.5 w-3.5" />
                    <span>
                      {newGalUrl ? 'Photograph Selected ✓' : 'Choose Image File from Device'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, (dataUrl) => setNewGalUrl(dataUrl));
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newGalTitle.trim()) return;
                      const item: GalleryItem = {
                        id: `gal_${Date.now()}`,
                        hostelId: 'bcm-296',
                        title: newGalTitle.trim(),
                        category: newGalCategory,
                        altText: newGalAlt.trim() || newGalTitle.trim(),
                        imageUrl: newGalUrl,
                        isRealPhoto: Boolean(newGalUrl),
                        order: gallery.length + 1,
                        updatedBy: user?.uid || 'local_admin',
                      };
                      saveGalleryItem(item);
                      setNewGalTitle('');
                      setNewGalAlt('');
                      setNewGalUrl('');
                      showFeedback('Gallery item saved.');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#102A43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1769AA]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add to Gallery</span>
                  </button>
                </div>
              </div>

              {/* Existing Gallery Items */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {gallery.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-xl border border-[#102A43]/12 bg-white p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#243447]/75">
                        <span>
                          {item.category} ·{' '}
                          {item.isRealPhoto ? 'Verified Photo' : 'Architectural Placeholder'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            deleteGalleryItem(item.id);
                            showFeedback('Gallery item deleted.');
                          }}
                          className="text-red-700 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => saveGalleryItem({ ...item, title: e.target.value })}
                        className="mt-2 w-full rounded-lg border border-[#102A43]/20 px-3 py-1.5 text-xs font-semibold text-[#102A43]"
                      />
                      <input
                        type="text"
                        value={item.altText}
                        onChange={(e) => saveGalleryItem({ ...item, altText: e.target.value })}
                        placeholder="Alt text"
                        className="mt-2 w-full rounded-lg border border-[#102A43]/20 px-3 py-1.5 text-xs text-[#243447]"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#E8F0F7] px-3 py-1.5 text-xs font-semibold text-[#102A43] hover:bg-[#E8F0F7]/80">
                        <Upload className="h-3.5 w-3.5" />
                        <span>
                          {item.isRealPhoto ? 'Replace Real Photo' : 'Upload Real Property Photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, (dataUrl) => {
                                saveGalleryItem({
                                  ...item,
                                  imageUrl: dataUrl,
                                  isRealPhoto: true,
                                });
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: CONTACT INFORMATION & FAQS */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              {/* Contact & Institutional Copy */}
              <div className="rounded-xl border border-[#102A43]/12 bg-white p-6">
                <h2 className="text-lg font-semibold text-[#102A43]">
                  Hostel Contact & Institutional Copy
                </h2>
                <p className="mt-1 text-xs text-[#243447]/75">
                  Leave the email field blank unless an official hostel email address has been
                  verified.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#102A43]">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={configDraft.hostelName}
                      onChange={(e) =>
                        setConfigDraft({ ...configDraft, hostelName: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#102A43]">
                      Public Phone Number
                    </label>
                    <input
                      type="text"
                      value={configDraft.phone}
                      onChange={(e) => setConfigDraft({ ...configDraft, phone: e.target.value })}
                      className="font-mono-tabular mt-1 w-full rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#102A43]">
                      Official Email (Optional — only shown if filled)
                    </label>
                    <input
                      type="email"
                      placeholder="Leave blank if none"
                      value={configDraft.email}
                      onChange={(e) => setConfigDraft({ ...configDraft, email: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#102A43]">
                      Visiting / Office Hours Notice
                    </label>
                    <input
                      type="text"
                      value={configDraft.openingHours}
                      onChange={(e) =>
                        setConfigDraft({ ...configDraft, openingHours: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#102A43]">
                      Address
                    </label>
                    <input
                      type="text"
                      value={configDraft.address}
                      onChange={(e) => setConfigDraft({ ...configDraft, address: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#102A43]">
                      About Section Copy
                    </label>
                    <textarea
                      rows={3}
                      value={configDraft.aboutDescription}
                      onChange={(e) =>
                        setConfigDraft({ ...configDraft, aboutDescription: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#102A43]">
                      Admission & Check-In Requirements Copy
                    </label>
                    <textarea
                      rows={2}
                      value={configDraft.admissionRequirements}
                      onChange={(e) =>
                        setConfigDraft({ ...configDraft, admissionRequirements: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    saveSiteConfig(configDraft);
                    showFeedback('Saved contact and institutional details.');
                  }}
                  className="mt-4 rounded-lg bg-[#102A43] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1769AA]"
                >
                  Save Contact & Copy Settings
                </button>
              </div>

              {/* FAQs Editor */}
              <div className="rounded-xl border border-[#102A43]/12 bg-white p-6">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-[#1769AA]" />
                  <h2 className="text-lg font-semibold text-[#102A43]">Manage FAQs</h2>
                </div>

                <div className="mt-4 space-y-4">
                  {faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="rounded-lg border border-[#102A43]/12 bg-[#F8FAFC] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => saveFaqItem({ ...faq, question: e.target.value })}
                          className="w-full rounded border border-[#102A43]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#102A43]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            deleteFaqItem(faq.id);
                            showFeedback('FAQ deleted.');
                          }}
                          className="text-xs text-red-700 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => saveFaqItem({ ...faq, answer: e.target.value })}
                        className="mt-2 w-full rounded border border-[#102A43]/20 bg-white px-3 py-1.5 text-xs text-[#243447]"
                      />
                      <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-medium text-[#2E7D5B]">
                        <input
                          type="checkbox"
                          checked={faq.isVerifiedAnswer}
                          onChange={(e) =>
                            saveFaqItem({ ...faq, isVerifiedAnswer: e.target.checked })
                          }
                        />
                        <span>Verified by Management</span>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-[#102A43]/10 pt-4">
                  <h3 className="text-xs font-semibold text-[#102A43]">Add New FAQ</h3>
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Question"
                      value={newFaqQuestion}
                      onChange={(e) => setNewFaqQuestion(e.target.value)}
                      className="w-full rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                    />
                    <textarea
                      rows={2}
                      placeholder="Answer"
                      value={newFaqAnswer}
                      onChange={(e) => setNewFaqAnswer(e.target.value)}
                      className="w-full rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={newFaqVerified}
                          onChange={(e) => setNewFaqVerified(e.target.checked)}
                        />
                        <span>Mark answer as verified</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newFaqQuestion.trim()) return;
                          const item: FaqItem = {
                            id: `faq_${Date.now()}`,
                            hostelId: 'bcm-296',
                            question: newFaqQuestion.trim(),
                            answer: newFaqAnswer.trim(),
                            isVerifiedAnswer: newFaqVerified,
                            order: faqs.length + 1,
                            updatedBy: user?.uid || 'local_admin',
                          };
                          saveFaqItem(item);
                          setNewFaqQuestion('');
                          showFeedback('Added FAQ.');
                        }}
                        className="rounded-lg bg-[#102A43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1769AA]"
                      >
                        Add FAQ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
