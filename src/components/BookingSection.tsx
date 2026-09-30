import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  PhoneCall,
  AlertCircle,
} from 'lucide-react';
import { useHostel } from '../context/HostelContext';
import { RequirementType, EnquiryItem } from '../types';

interface BookingSectionProps {
  initialRequirement?: RequirementType;
  initialRoomType?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const BookingSection: React.FC<BookingSectionProps> = ({
  initialRequirement = 'Accommodation enquiry',
  initialRoomType = '',
}) => {
  const { siteConfig, rooms, submitEnquiry, user, signInWithGoogle } = useHostel();

  const [viewMode, setViewMode] = useState<'wizard' | 'single'>('wizard');
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [requirementType, setRequirementType] = useState<RequirementType>(initialRequirement);
  const [preferredVisitDate, setPreferredVisitDate] = useState<string>('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string>('');
  const [preferredMoveInDate, setPreferredMoveInDate] = useState<string>('');
  const [occupantsCount, setOccupantsCount] = useState<number>(1);
  const [preferredRoomType, setPreferredRoomType] = useState<string>(
    initialRoomType || (rooms[0]?.name ?? 'Standard Student Room')
  );
  const [fullName, setFullName] = useState<string>(user?.displayName || '');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [studentName, setStudentName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [consentGiven, setConsentGiven] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedRecord, setSubmittedRecord] = useState<EnquiryItem | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Sync props when user clicks "Check Availability" or "Schedule a Visit" from other sections
  React.useEffect(() => {
    setRequirementType(initialRequirement);
  }, [initialRequirement]);

  React.useEffect(() => {
    if (initialRoomType) {
      setPreferredRoomType(initialRoomType);
    }
  }, [initialRoomType]);

  // Generate 21 upcoming calendar days for Step 2
  const upcomingDates = useMemo(() => {
    const result: {
      iso: string;
      dayName: string;
      shortDay: string;
      dayNum: string;
      monthShort: string;
      isAvailable: boolean;
      reason?: string;
    }[] = [];

    const today = new Date();
    for (let i = 0; i < 21; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const dayName = DAY_NAMES[d.getDay()];
      const isDayAllowed = siteConfig.availableDays.includes(dayName);
      const isBlocked = siteConfig.blockedDates.includes(iso);

      result.push({
        iso,
        dayName,
        shortDay: dayName.slice(0, 3),
        dayNum: String(d.getDate()).padStart(2, '0'),
        monthShort: d.toLocaleString('en-US', { month: 'short' }),
        isAvailable: isDayAllowed && !isBlocked,
        reason: isBlocked ? 'Blocked by admin' : !isDayAllowed ? 'Closed for visits' : undefined,
      });
    }
    return result;
  }, [siteConfig.availableDays, siteConfig.blockedDates]);

  // Select first available date & time slot by default
  React.useEffect(() => {
    if (!preferredVisitDate) {
      const firstOpen = upcomingDates.find((d) => d.isAvailable);
      if (firstOpen) {
        setPreferredVisitDate(firstOpen.iso);
      }
    }
    if (!preferredTimeSlot && siteConfig.availableTimeSlots.length > 0) {
      setPreferredTimeSlot(siteConfig.availableTimeSlots[0]);
    }
  }, [upcomingDates, siteConfig.availableTimeSlots, preferredVisitDate, preferredTimeSlot]);

  const validateStep = (targetStep: number): boolean => {
    setErrorMsg('');
    if (targetStep > 2 && !preferredVisitDate) {
      setErrorMsg('Please select an available date on the calendar.');
      return false;
    }
    if (targetStep > 3 && !preferredTimeSlot) {
      setErrorMsg('Please choose a preferred time slot.');
      return false;
    }
    return true;
  };

  const validateFullForm = (): boolean => {
    setErrorMsg('');
    if (fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return false;
    }
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number so management can contact you.');
      return false;
    }
    if (email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address or leave the email field blank.');
      return false;
    }
    if (!preferredVisitDate) {
      setErrorMsg('Please select a preferred visit or callback date.');
      return false;
    }
    if (!preferredTimeSlot) {
      setErrorMsg('Please select a preferred time slot.');
      return false;
    }
    if (!consentGiven) {
      setErrorMsg('Please check the consent box to confirm that hostel management may contact you.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFullForm()) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      const record = await submitEnquiry({
        requirementType,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        studentName: studentName.trim() || fullName.trim(),
        preferredMoveInDate: preferredMoveInDate.trim(),
        occupantsCount: Number(occupantsCount) || 1,
        preferredRoomType: preferredRoomType.trim(),
        preferredVisitDate,
        preferredTimeSlot,
        message: message.trim(),
        consentGiven: true,
      });
      setSubmittedRecord(record);
      setStep(5);
    } catch {
      setErrorMsg(
        'We encountered an issue saving your request. Please try again or call +91 74114 39441 directly.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (!submittedRecord) return;
    navigator.clipboard?.writeText(submittedRecord.referenceNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const resetForm = () => {
    setSubmittedRecord(null);
    setStep(1);
    setMessage('');
    setConsentGiven(false);
    setErrorMsg('');
  };

  return (
    <section
      id="booking"
      aria-labelledby="booking-heading"
      className="border-y border-[#102A43]/10 bg-[#E8F0F7]/55 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-[#102A43]/10 pb-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-[#1769AA]">
              <span>Online Enquiry & Appointment System</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>Subject to Management Confirmation</span>
            </p>
            <h2
              id="booking-heading"
              className="mt-2 text-3xl font-normal tracking-tight text-[#102A43] sm:text-4xl [text-wrap:balance]"
            >
              Schedule a Visit or Request Accommodation
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#243447]/85">
              Submit your preferred visit date, time slot, and student accommodation requirements.
              Appointments are confirmed by hostel management after reviewing availability.
            </p>
          </div>

          {/* Interactive Segmented Mode Switcher */}
          {step !== 5 && (
            <div
              role="group"
              aria-label="Booking form layout mode"
              className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg border border-[#102A43]/12 bg-white p-1"
            >
              <button
                type="button"
                onClick={() => setViewMode('wizard')}
                className={`rounded-md px-3.5 py-2 text-xs font-semibold transition-colors duration-150 whitespace-nowrap ${
                  viewMode === 'wizard'
                    ? 'bg-[#102A43] text-white'
                    : 'text-[#243447] hover:text-[#102A43]'
                }`}
              >
                5-Step Guided Flow
              </button>
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`rounded-md px-3.5 py-2 text-xs font-semibold transition-colors duration-150 whitespace-nowrap ${
                  viewMode === 'single'
                    ? 'bg-[#102A43] text-white'
                    : 'text-[#243447] hover:text-[#102A43]'
                }`}
              >
                Direct Single Form
              </button>
            </div>
          )}
        </div>

        {/* Main Form Surface (Single Elevation Depth) */}
        <div className="mt-8 rounded-xl border border-[#102A43]/12 bg-white p-6 sm:p-8 lg:p-10">
          {/* Step Progress Bar (when in wizard mode) */}
          {viewMode === 'wizard' && (
            <nav aria-label="Booking progress" className="mb-8 border-b border-[#102A43]/10 pb-6">
              <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { num: 1, label: '01. Requirement' },
                  { num: 2, label: '02. Select Date' },
                  { num: 3, label: '03. Preferred Time' },
                  { num: 4, label: '04. Your Details' },
                  { num: 5, label: '05. Confirmation' },
                ].map((item) => {
                  const isActive = step === item.num;
                  const isCompleted = step > item.num;
                  return (
                    <li key={item.num} className="flex items-center">
                      <button
                        type="button"
                        disabled={item.num === 5 || item.num > step}
                        onClick={() => {
                          if (item.num < step) setStep(item.num as 1 | 2 | 3 | 4);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors duration-150 whitespace-nowrap ${
                          isActive
                            ? 'bg-[#102A43] text-white'
                            : isCompleted
                            ? 'bg-[#E8F0F7] text-[#102A43] hover:bg-[#E8F0F7]/80'
                            : 'bg-[#F8FAFC] text-[#243447]/50'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        {isCompleted && <Check className="ml-1.5 h-3.5 w-3.5 shrink-0 text-[#2E7D5B]" />}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-lg border border-red-700/25 bg-red-50 p-4 text-sm text-red-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 5: CONFIRMATION STATE */}
          {step === 5 && submittedRecord ? (
            <div className="py-4">
              <div className="flex flex-col items-start gap-4 border-b border-[#102A43]/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-[#2E7D5B]" />
                  <div>
                    <p className="text-xs font-medium text-[#2E7D5B]">
                      Enquiry Logged · Pending Management Verification
                    </p>
                    <h3 className="mt-1 text-2xl font-normal text-[#102A43]">
                      Thank you! Your enquiry has been received.
                    </h3>
                    <p className="mt-1 text-sm text-[#243447]">
                      Our team will contact you to confirm availability and the requested visit time.
                    </p>
                  </div>
                </div>

                {/* Reference Number Box */}
                <div className="w-full rounded-lg border border-[#102A43]/15 bg-[#F8FAFC] p-4 sm:w-auto">
                  <p className="text-xs text-[#243447]/75">Enquiry Reference Number</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="font-mono-tabular text-base font-semibold text-[#102A43]">
                      {submittedRecord.referenceNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyRef}
                      className="inline-flex items-center gap-1 rounded-md border border-[#102A43]/15 bg-white px-2.5 py-1 text-xs font-medium text-[#102A43] hover:bg-[#E8F0F7] whitespace-nowrap"
                    >
                      {copiedRef ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#2E7D5B]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary of User-Submitted Details */}
              <div className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div className="border-b border-[#102A43]/10 pb-3">
                  <p className="text-xs text-[#243447]/70">Requirement Type</p>
                  <p className="mt-0.5 font-semibold text-[#102A43]">
                    {submittedRecord.requirementType}
                  </p>
                </div>
                <div className="border-b border-[#102A43]/10 pb-3">
                  <p className="text-xs text-[#243447]/70">Applicant / Student Name</p>
                  <p className="mt-0.5 font-semibold text-[#102A43]">
                    {submittedRecord.fullName}
                    {submittedRecord.studentName &&
                    submittedRecord.studentName !== submittedRecord.fullName
                      ? ` (${submittedRecord.studentName})`
                      : ''}
                  </p>
                </div>
                <div className="border-b border-[#102A43]/10 pb-3">
                  <p className="text-xs text-[#243447]/70">Contact Phone</p>
                  <p className="mt-0.5 font-mono-tabular font-semibold text-[#102A43]">
                    {submittedRecord.phone}
                  </p>
                </div>
                <div className="border-b border-[#102A43]/10 pb-3">
                  <p className="text-xs text-[#243447]/70">Requested Visit Date & Slot</p>
                  <p className="mt-0.5 font-mono-tabular font-semibold text-[#102A43]">
                    {submittedRecord.preferredVisitDate} · {submittedRecord.preferredTimeSlot}
                  </p>
                </div>
                <div className="border-b border-[#102A43]/10 pb-3">
                  <p className="text-xs text-[#243447]/70">Preferred Room & Occupants</p>
                  <p className="mt-0.5 font-semibold text-[#102A43]">
                    {submittedRecord.preferredRoomType || 'Any available'} ·{' '}
                    <span className="font-mono-tabular">{submittedRecord.occupantsCount}</span>{' '}
                    occupant(s)
                  </p>
                </div>
                <div className="border-b border-[#102A43]/10 pb-3">
                  <p className="text-xs text-[#243447]/70">Current Status</p>
                  <p className="mt-0.5 font-semibold text-[#1769AA]">
                    {submittedRecord.status} (Awaiting Staff Confirmation)
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="text-xs text-[#243447]/80">
                  Need immediate assistance? Call hostel management directly at{' '}
                  <a
                    href={`tel:${siteConfig.phone.replace(/\s+/g, '')}`}
                    className="font-mono-tabular font-semibold text-[#102A43] underline"
                  >
                    {siteConfig.phone}
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`tel:${siteConfig.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#102A43]/20 bg-white px-4 py-2.5 text-xs font-semibold text-[#102A43] hover:bg-[#E8F0F7] whitespace-nowrap"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>Call {siteConfig.phone}</span>
                  </a>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#102A43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#102A43]/90 whitespace-nowrap"
                  >
                    <span>Submit Another Enquiry</span>
                  </button>
                </div>
              </div>
            </div>
          ) : viewMode === 'wizard' ? (
            /* 5-STEP WIZARD INTERFACE */
            <form onSubmit={handleSubmit} noValidate>
              {/* STEP 1: CHOOSE REQUIREMENT */}
              {step === 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-[#102A43]">
                    01. Choose Your Requirement
                  </h3>
                  <p className="mt-1 text-sm text-[#243447]/80">
                    Select the purpose of your request so we can route it appropriately.
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {(
                      [
                        {
                          type: 'Accommodation enquiry',
                          title: 'Accommodation Enquiry',
                          desc: 'Check student bed/room availability, admission eligibility, and move-in details.',
                        },
                        {
                          type: 'Hostel visit',
                          title: 'Schedule a Hostel Visit',
                          desc: 'Request an in-person appointment for students, parents, or guardians to inspect the facility.',
                        },
                        {
                          type: 'General enquiry',
                          title: 'General Enquiry',
                          desc: 'Ask management about hostel timings, required documents, or facility specifics.',
                        },
                      ] as const
                    ).map((option) => {
                      const selected = requirementType === option.type;
                      return (
                        <button
                          key={option.type}
                          type="button"
                          onClick={() => setRequirementType(option.type)}
                          className={`flex flex-col justify-between rounded-xl border p-5 text-left transition-colors duration-150 ${
                            selected
                              ? 'border-[#1769AA] bg-[#E8F0F7]/65'
                              : 'border-[#102A43]/15 bg-[#F8FAFC] hover:border-[#102A43]/35'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-base font-semibold text-[#102A43]">
                                {option.title}
                              </span>
                              <span
                                className={`h-4 w-4 rounded-full border ${
                                  selected
                                    ? 'border-[#1769AA] bg-[#1769AA]'
                                    : 'border-[#243447]/40 bg-white'
                                }`}
                              />
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-[#243447]/85">
                              {option.desc}
                            </p>
                          </div>
                          <p className="mt-4 text-xs font-medium text-[#1769AA]">
                            {selected ? 'Selected requirement' : 'Click to select'}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Room & Occupant Preferences */}
                  <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#102A43]/10 pt-6 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="wiz-room-type"
                        className="block text-xs font-semibold text-[#102A43]"
                      >
                        Preferred Room Category
                      </label>
                      <select
                        id="wiz-room-type"
                        value={preferredRoomType}
                        onChange={(e) => setPreferredRoomType(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43] focus:border-[#1769AA] focus:outline-none"
                      >
                        {rooms.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                        <option value="Not sure / Discuss during visit">
                          Not sure / Discuss during visit
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="wiz-occupants"
                        className="block text-xs font-semibold text-[#102A43]"
                      >
                        Number of Student Occupants
                      </label>
                      <input
                        id="wiz-occupants"
                        type="number"
                        min={1}
                        max={10}
                        value={occupantsCount}
                        onChange={(e) => setOccupantsCount(Number(e.target.value) || 1)}
                        className="font-mono-tabular mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43] focus:border-[#1769AA] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="wiz-move-in"
                        className="block text-xs font-semibold text-[#102A43]"
                      >
                        Preferred Move-in Date (Optional)
                      </label>
                      <input
                        id="wiz-move-in"
                        type="date"
                        value={preferredMoveInDate}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setPreferredMoveInDate(e.target.value)}
                        className="font-mono-tabular mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43] focus:border-[#1769AA] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#102A43] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#1769AA] whitespace-nowrap"
                    >
                      <span>Continue to Select Date</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT DATE (CALENDAR INTERFACE) */}
              {step === 2 && (
                <div>
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-[#102A43]">
                        02. Select Preferred Visit / Callback Date
                      </h3>
                      <p className="mt-1 text-sm text-[#243447]/80">
                        Available days configured by administration:{' '}
                        <span className="font-medium text-[#102A43]">
                          {siteConfig.availableDays.join(', ') || 'Contact management'}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#243447]">
                      <CalendarIcon className="h-4 w-4 text-[#1769AA]" />
                      <span className="font-mono-tabular">
                        Selected: {preferredVisitDate || 'None'}
                      </span>
                    </div>
                  </div>

                  {/* Accessible Calendar Grid */}
                  <div
                    role="radiogroup"
                    aria-label="Available visit dates"
                    className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-7"
                  >
                    {upcomingDates.map((d) => {
                      const isSelected = preferredVisitDate === d.iso;
                      return (
                        <button
                          key={d.iso}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          disabled={!d.isAvailable}
                          onClick={() => setPreferredVisitDate(d.iso)}
                          className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-colors duration-150 ${
                            !d.isAvailable
                              ? 'cursor-not-allowed border-[#102A43]/10 bg-[#F8FAFC] text-[#243447]/35 opacity-60'
                              : isSelected
                              ? 'border-[#102A43] bg-[#102A43] text-white'
                              : 'border-[#102A43]/15 bg-white text-[#102A43] hover:border-[#1769AA] hover:bg-[#E8F0F7]/50'
                          }`}
                        >
                          <span className="text-xs font-medium">{d.shortDay}</span>
                          <span className="font-mono-tabular mt-1 text-lg font-bold">
                            {d.dayNum}
                          </span>
                          <span className="text-xs opacity-80">{d.monthShort}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Date Input Fallback for Further Dates */}
                  <div className="mt-6 flex flex-col gap-3 border-t border-[#102A43]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <label
                      htmlFor="custom-visit-date"
                      className="text-xs font-medium text-[#243447]"
                    >
                      Planning a date further ahead? Pick any date on the calendar:
                    </label>
                    <input
                      id="custom-visit-date"
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={preferredVisitDate}
                      onChange={(e) => setPreferredVisitDate(e.target.value)}
                      className="font-mono-tabular rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2 text-sm text-[#102A43]"
                    />
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#102A43]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#102A43] hover:bg-[#E8F0F7] whitespace-nowrap"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep(3)) setStep(3);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#102A43] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1769AA] whitespace-nowrap"
                    >
                      <span>Continue to Time Slots</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SELECT PREFERRED TIME SLOT */}
              {step === 3 && (
                <div>
                  <h3 className="text-lg font-semibold text-[#102A43]">
                    03. Select Preferred Time Slot
                  </h3>
                  <p className="mt-1 text-sm text-[#243447]/80">
                    Showing available time slots configured by the hostel administrator for{' '}
                    <span className="font-mono-tabular font-semibold text-[#102A43]">
                      {preferredVisitDate}
                    </span>
                    .
                  </p>

                  {siteConfig.availableTimeSlots.length === 0 ? (
                    <div className="mt-6 rounded-lg border border-[#102A43]/15 bg-[#F8FAFC] p-6 text-sm text-[#243447]">
                      No specific time slots are currently listed. Please call{' '}
                      <span className="font-mono-tabular font-semibold">{siteConfig.phone}</span> to
                      arrange a visiting time.
                    </div>
                  ) : (
                    <div
                      role="radiogroup"
                      aria-label="Available time slots"
                      className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      {siteConfig.availableTimeSlots.map((slot) => {
                        const isSelected = preferredTimeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setPreferredTimeSlot(slot)}
                            className={`flex items-center justify-between rounded-lg border px-4 py-3.5 text-left transition-colors duration-150 ${
                              isSelected
                                ? 'border-[#102A43] bg-[#102A43] text-white'
                                : 'border-[#102A43]/15 bg-[#F8FAFC] text-[#102A43] hover:border-[#1769AA] hover:bg-[#E8F0F7]/50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Clock className="h-4 w-4 shrink-0 opacity-80" />
                              <span className="font-mono-tabular text-sm font-medium">{slot}</span>
                            </div>
                            {isSelected && <Check className="h-4 w-4 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-8 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#102A43]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#102A43] hover:bg-[#E8F0F7] whitespace-nowrap"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Calendar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep(4)) setStep(4);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#102A43] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1769AA] whitespace-nowrap"
                    >
                      <span>Continue to Contact Details</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: ENTER DETAILS */}
              {step === 4 && (
                <div>
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-[#102A43]">
                        04. Enter Applicant & Student Details
                      </h3>
                      <p className="mt-1 text-sm text-[#243447]/80">
                        Provide your contact information so hostel management can confirm your
                        request.
                      </p>
                    </div>
                    {!user && (
                      <button
                        type="button"
                        onClick={signInWithGoogle}
                        className="self-start rounded-lg border border-[#102A43]/20 bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#102A43] hover:bg-[#E8F0F7] whitespace-nowrap"
                      >
                        Optional: Sign in with Google to prefill & sync
                      </button>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="enq-fullname"
                        className="block text-xs font-semibold text-[#102A43]"
                      >
                        Full Name (Parent / Guardian / Applicant) *
                      </label>
                      <input
                        id="enq-fullname"
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43] focus:border-[#1769AA] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="enq-phone"
                        className="block text-xs font-semibold text-[#102A43]"
                      >
                        Phone Number *
                      </label>
                      <input
                        id="enq-phone"
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="font-mono-tabular mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43] focus:border-[#1769AA] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="enq-student"
                        className="block text-xs font-semibold text-[#102A43]"
                      >
                        Student Name
                      </label>
                      <input
                        id="enq-student"
                        type="text"
                        placeholder="Student's full name (if different)"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43] focus:border-[#1769AA] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="enq-email"
                        className="block text-xs font-semibold text-[#102A43]"
                      >
                        Email Address (Optional)
                      </label>
                      <input
                        id="enq-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43] focus:border-[#1769AA] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="enq-message"
                        className="block text-xs font-semibold text-[#102A43]"
                      >
                        Message / Specific Questions
                      </label>
                      <textarea
                        id="enq-message"
                        rows={3}
                        placeholder="Mention college/school in Chikkaballapura, expected duration of stay, or any specific questions for management..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43] focus:border-[#1769AA] focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-[#243447]">
                        <input
                          type="checkbox"
                          checked={consentGiven}
                          onChange={(e) => setConsentGiven(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-[#102A43]/30 text-[#1769AA] focus:ring-[#1769AA]"
                        />
                        <span>
                          I consent to BCM BOYS HOSTEL 296 storing my enquiry details and contacting
                          me via phone or email regarding accommodation availability and visit
                          confirmation. *
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#102A43]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#102A43] hover:bg-[#E8F0F7] whitespace-nowrap"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Time Slot</span>
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D5B] px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#2E7D5B]/90 disabled:opacity-50 whitespace-nowrap"
                    >
                      <span>{submitting ? 'Submitting...' : 'Submit Enquiry'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            /* DIRECT SINGLE-PAGE FORM VIEW */
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label
                    htmlFor="single-req"
                    className="block text-xs font-semibold text-[#102A43]"
                  >
                    Enquiry Type *
                  </label>
                  <select
                    id="single-req"
                    value={requirementType}
                    onChange={(e) => setRequirementType(e.target.value as RequirementType)}
                    className="mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43]"
                  >
                    <option value="Accommodation enquiry">Accommodation enquiry</option>
                    <option value="Hostel visit">Hostel visit</option>
                    <option value="General enquiry">General enquiry</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="single-fullname"
                    className="block text-xs font-semibold text-[#102A43]"
                  >
                    Full Name *
                  </label>
                  <input
                    id="single-fullname"
                    type="text"
                    required
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="single-phone"
                    className="block text-xs font-semibold text-[#102A43]"
                  >
                    Phone Number *
                  </label>
                  <input
                    id="single-phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="font-mono-tabular mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="single-email"
                    className="block text-xs font-semibold text-[#102A43]"
                  >
                    Email Address
                  </label>
                  <input
                    id="single-email"
                    type="email"
                    placeholder="Optional email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="single-student"
                    className="block text-xs font-semibold text-[#102A43]"
                  >
                    Student Name
                  </label>
                  <input
                    id="single-student"
                    type="text"
                    placeholder="Student's full name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="single-movein"
                    className="block text-xs font-semibold text-[#102A43]"
                  >
                    Preferred Move-in Date
                  </label>
                  <input
                    id="single-movein"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={preferredMoveInDate}
                    onChange={(e) => setPreferredMoveInDate(e.target.value)}
                    className="font-mono-tabular mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="single-occupants"
                    className="block text-xs font-semibold text-[#102A43]"
                  >
                    Number of Occupants
                  </label>
                  <input
                    id="single-occupants"
                    type="number"
                    min={1}
                    max={10}
                    value={occupantsCount}
                    onChange={(e) => setOccupantsCount(Number(e.target.value) || 1)}
                    className="font-mono-tabular mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="single-room"
                    className="block text-xs font-semibold text-[#102A43]"
                  >
                    Preferred Room Type
                  </label>
                  <select
                    id="single-room"
                    value={preferredRoomType}
                    onChange={(e) => setPreferredRoomType(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43]"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                    <option value="Not sure / Discuss during visit">
                      Not sure / Discuss during visit
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="single-visitdate"
                    className="block text-xs font-semibold text-[#102A43]"
                  >
                    Preferred Visit Date *
                  </label>
                  <input
                    id="single-visitdate"
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={preferredVisitDate}
                    onChange={(e) => setPreferredVisitDate(e.target.value)}
                    className="font-mono-tabular mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43]"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label
                    htmlFor="single-slot"
                    className="block text-xs font-semibold text-[#102A43]"
                  >
                    Preferred Time Slot *
                  </label>
                  <select
                    id="single-slot"
                    value={preferredTimeSlot}
                    onChange={(e) => setPreferredTimeSlot(e.target.value)}
                    className="font-mono-tabular mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43]"
                  >
                    {siteConfig.availableTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label
                    htmlFor="single-msg"
                    className="block text-xs font-semibold text-[#102A43]"
                  >
                    Message
                  </label>
                  <textarea
                    id="single-msg"
                    rows={3}
                    placeholder="Additional details or questions regarding accommodation..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#102A43]/20 bg-white px-3.5 py-2.5 text-sm text-[#102A43]"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-[#243447]">
                    <input
                      type="checkbox"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[#102A43]/30 text-[#1769AA]"
                    />
                    <span>
                      I consent to BCM BOYS HOSTEL 296 storing my enquiry information and contacting
                      me to confirm room availability and visit scheduling. *
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D5B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2E7D5B]/90 disabled:opacity-50 whitespace-nowrap"
                >
                  <span>{submitting ? 'Submitting...' : 'Submit Enquiry'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
