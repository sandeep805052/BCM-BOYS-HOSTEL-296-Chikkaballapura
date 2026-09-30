/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Phone,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Navigation,
  ArrowRight,
  Bed,
  BookOpen,
  Utensils,
  Wifi,
  Shirt,
  Droplets,
  Zap,
  Car,
  Shield,
  Users,
  CheckCircle,
  Lock,
} from 'lucide-react';
import { HostelProvider, useHostel } from './context/HostelContext';
import { PropertyVisualFrame } from './components/PropertyVisualFrame';
import { BookingSection } from './components/BookingSection';
import { AdminDashboard } from './components/AdminDashboard';
import { RequirementType, GalleryCategory, GalleryItem } from './types';

const FACILITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Bed,
  BookOpen,
  Utensils,
  Wifi,
  Shirt,
  Droplets,
  Zap,
  Car,
  Shield,
  Users,
  CheckCircle,
};

const GALLERY_FILTER_CATEGORIES: ('All' | GalleryCategory)[] = [
  'All',
  'Exterior',
  'Rooms',
  'Study Areas',
  'Dining',
  'Common Areas',
  'Facilities',
  'Surroundings',
];

const GOOGLE_MAPS_DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=CPJH%2B943%2C+Chikkaballapur%2C+Karnataka+562101%2C+India';

function HostelWebsiteContent() {
  const { siteConfig, facilities, rooms, gallery, faqs, isAdmin } = useHostel();

  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [adminInitialTab, setAdminInitialTab] = useState<
    'enquiries' | 'schedule' | 'rooms' | 'facilities' | 'gallery' | 'settings'
  >('enquiries');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Booking preset state
  const [bookingReqType, setBookingReqType] = useState<RequirementType>('Accommodation enquiry');
  const [bookingRoomType, setBookingRoomType] = useState<string>('');

  // Gallery filter & Lightbox state
  const [galleryCategory, setGalleryCategory] = useState<'All' | GalleryCategory>('All');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  // FAQ accordion state
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqs[0]?.id || null);

  // Legal modal state (Privacy Policy / Terms)
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  const navigateToBooking = (reqType: RequirementType, roomName = '') => {
    setBookingReqType(reqType);
    if (roomName) {
      setBookingRoomType(roomName);
    }
    setMobileMenuOpen(false);
    const el = document.getElementById('booking');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openAdminSection = (
    tab: 'enquiries' | 'schedule' | 'rooms' | 'facilities' | 'gallery' | 'settings'
  ) => {
    setAdminInitialTab(tab);
    setIsAdminView(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isAdminView) {
    return (
      <AdminDashboard
        onExitAdmin={() => setIsAdminView(false)}
        initialTab={adminInitialTab}
      />
    );
  }

  const activeFacilities = facilities.filter((f) => f.active);
  const filteredGallery =
    galleryCategory === 'All'
      ? gallery
      : gallery.filter((item) => item.category === galleryCategory);

  const cleanPhoneHref = `tel:${siteConfig.phone.replace(/\s+/g, '')}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 text-[#243447] md:pb-0">
      {/* =====================================================================
          5. STICKY TOP NAVIGATION (Strict 3-Zone Top Bar Contract)
          ===================================================================== */}
      <header className="sticky top-0 z-40 h-14 border-b border-[#102A43]/10 bg-white/95 backdrop-blur-xs sm:h-16">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#home"
            className="font-serif-display text-xl font-normal tracking-tight text-[#102A43] sm:text-2xl whitespace-nowrap"
          >
            {siteConfig.hostelName}
          </a>

          {/* Zone 2: Clean text navigation links */}
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-6 text-sm font-medium text-[#243447] lg:flex"
          >
            <a
              href="#home"
              className="transition-colors duration-150 hover:text-[#102A43] hover:underline hover:underline-offset-4 whitespace-nowrap"
            >
              Home
            </a>
            <a
              href="#about"
              className="transition-colors duration-150 hover:text-[#102A43] hover:underline hover:underline-offset-4 whitespace-nowrap"
            >
              About
            </a>
            <a
              href="#rooms"
              className="transition-colors duration-150 hover:text-[#102A43] hover:underline hover:underline-offset-4 whitespace-nowrap"
            >
              Rooms
            </a>
            <a
              href="#facilities"
              className="transition-colors duration-150 hover:text-[#102A43] hover:underline hover:underline-offset-4 whitespace-nowrap"
            >
              Facilities
            </a>
            <a
              href="#gallery"
              className="transition-colors duration-150 hover:text-[#102A43] hover:underline hover:underline-offset-4 whitespace-nowrap"
            >
              Gallery
            </a>
            <a
              href="#location"
              className="transition-colors duration-150 hover:text-[#102A43] hover:underline hover:underline-offset-4 whitespace-nowrap"
            >
              Location
            </a>
            <a
              href="#faq"
              className="transition-colors duration-150 hover:text-[#102A43] hover:underline hover:underline-offset-4 whitespace-nowrap"
            >
              FAQ
            </a>
            <a
              href="#contact"
              className="transition-colors duration-150 hover:text-[#102A43] hover:underline hover:underline-offset-4 whitespace-nowrap"
            >
              Contact
            </a>
          </nav>

          {/* Zone 3: 1-2 Primary Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openAdminSection('enquiries')}
              className="hidden items-center gap-1.5 rounded-lg border border-[#102A43]/15 px-3 py-2 text-xs font-medium text-[#243447] transition-colors duration-150 hover:border-[#102A43]/35 hover:text-[#102A43] sm:inline-flex whitespace-nowrap"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Staff Console</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToBooking('Accommodation enquiry')}
              className="rounded-lg bg-[#102A43] px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#1769AA] sm:text-sm whitespace-nowrap"
            >
              Book / Enquire
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#102A43]/15 text-[#102A43] lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="border-b border-[#102A43]/15 bg-white px-4 pt-3 pb-5 shadow-lg lg:hidden">
            <nav aria-label="Mobile navigation" className="flex flex-col space-y-2.5 text-sm">
              {[
                { label: 'Home', href: '#home' },
                { label: 'About', href: '#about' },
                { label: 'Rooms', href: '#rooms' },
                { label: 'Facilities', href: '#facilities' },
                { label: 'Gallery', href: '#gallery' },
                { label: 'Location', href: '#location' },
                { label: 'FAQ', href: '#faq' },
                { label: 'Contact', href: '#contact' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 font-medium text-[#102A43] hover:bg-[#E8F0F7]"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-[#102A43]/10 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAdminSection('enquiries');
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-[#102A43]/20 px-4 py-2.5 text-xs font-semibold text-[#102A43]"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Open Management / Admin Console</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* =====================================================================
          4. HERO SECTION WITH FULL-BLEED BACKGROUND IMAGE
          ===================================================================== */}
      <section
        id="home"
        aria-labelledby="hero-heading"
        className="relative overflow-hidden bg-[#F8FAFC] pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28"
      >
        {/* Background Image Layer + Measured Scrim for WCAG Contrast */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero_warm_sunset_background_1790787847534.jpg"
            alt="Warm sunset terrace background for BCM BOYS HOSTEL 296"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F8FAFC]/95 via-[#F8FAFC]/82 to-[#F8FAFC]/30 sm:from-[#F8FAFC]/94 sm:via-[#F8FAFC]/75 sm:to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#F8FAFC] to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Editorial Column (7 cols) */}
            <div className="lg:col-span-7">
              {/* Quiet Unboxed Location & Category Metadata (Zero-Pill Discipline) */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#1769AA] sm:text-sm">
                <span>Chikkaballapura, Karnataka</span>
                <span aria-hidden="true">·</span>
                <span>Boys Hostel &amp; Student Accommodation</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular text-[#102A43]">562101</span>
              </div>

              <h1
                id="hero-heading"
                className="mt-4 text-4xl font-normal leading-[1.12] tracking-tight text-[#102A43] sm:text-5xl lg:text-6xl [text-wrap:balance]"
              >
                A Comfortable Place to Stay, Study &amp; Grow
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#102A43]/90 sm:text-lg">
                BCM BOYS HOSTEL 296, Chikkaballapura — a dedicated accommodation facility for boys
                seeking a convenient and supportive place to stay.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => navigateToBooking('Accommodation enquiry')}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#102A43] px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#1769AA] whitespace-nowrap"
                >
                  <span>Check Availability</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => navigateToBooking('Hostel visit')}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#102A43]/25 bg-white/95 px-6 py-3 text-sm font-semibold text-[#102A43] transition-colors duration-150 hover:bg-[#E8F0F7] whitespace-nowrap"
                >
                  <Calendar className="h-4 w-4 text-[#1769AA]" />
                  <span>Schedule a Visit</span>
                </button>

                <a
                  href={cleanPhoneHref}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-white/80 px-4 py-3 text-sm font-semibold text-[#102A43] backdrop-blur-xs hover:bg-white hover:underline whitespace-nowrap"
                >
                  <Phone className="h-4 w-4 text-[#2E7D5B]" />
                  <span className="font-mono-tabular">{siteConfig.phone}</span>
                </a>
              </div>

              {/* Concise Public Listing Trust Indicator */}
              <div className="mt-10 border-t border-[#102A43]/15 pt-5 text-xs text-[#102A43]/90 sm:text-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono-tabular font-semibold text-[#102A43]">5.0 ★</span>
                  <span aria-hidden="true">·</span>
                  <span>Based on 3 public Google reviews</span>
                  <span aria-hidden="true">·</span>
                  <span>CPJH+943, Chikkaballapur, Karnataka 562101</span>
                </div>
              </div>
            </div>

            {/* Right Visual Column (5 cols) */}
            <div className="lg:col-span-5">
              <PropertyVisualFrame
                variant="hero"
                imageUrl={
                  siteConfig.heroPhotoUrl ||
                  '/src/assets/images/hero_warm_sunset_background_1790787847534.jpg'
                }
                altText="BCM BOYS HOSTEL 296 living environment in Chikkaballapura, Karnataka"
                title="BCM BOYS HOSTEL 296 — Residential Facility"
                categoryLabel="Chikkaballapura, Karnataka"
                aspectClass="aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3]"
                isAdmin={isAdmin}
                onManageUpload={() => openAdminSection('gallery')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. CONCISE TRUST SECTION
          ===================================================================== */}
      <section
        aria-label="Hostel overview and public rating"
        className="border-y border-[#102A43]/10 bg-white py-10 sm:py-12"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Verified Identity & Public Rating */}
            <div className="border-b border-[#102A43]/10 pb-6 lg:col-span-5 lg:border-r lg:border-b-0 lg:pr-8 lg:pb-0">
              <p className="text-xs font-medium text-[#1769AA]">
                Verified Public Listing Information
              </p>
              <h2 className="mt-1 text-2xl font-normal text-[#102A43]">
                {siteConfig.hostelName} · Chikkaballapura, Karnataka
              </h2>
              <div className="mt-3 flex flex-wrap items-baseline gap-3 text-sm text-[#243447]">
                <span className="font-mono-tabular text-lg font-bold text-[#102A43]">5.0 ★</span>
                <span>3 Google reviews</span>
                <span aria-hidden="true">·</span>
                <span className="text-xs text-[#243447]/75">
                  Early public rating (contact management for direct facility walkthrough)
                </span>
              </div>
            </div>

            {/* 4 Institutional Pillars */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-7">
              <div>
                <h3 className="text-sm font-semibold text-[#102A43]">
                  01. Convenient Accommodation
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#243447]/85">
                  Dedicated residential facility for boys and students staying in Chikkaballapur.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#102A43]">
                  02. Student-Focused Environment
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#243447]/85">
                  Structured setting oriented around academic routines and daily student living.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#102A43]">
                  03. Easy Enquiry Process
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#243447]/85">
                  Request room availability or schedule a campus visit online or by phone.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#102A43]">
                  04. Local Accessibility
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#243447]/85">
                  Situated at CPJH+943, Chikkaballapur, Karnataka 562101 with direct road access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. ABOUT SECTION
          ===================================================================== */}
      <section id="about" aria-labelledby="about-heading" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
            {/* Editorial Copy (6 cols) */}
            <div className="lg:col-span-6">
              <p className="text-xs font-medium text-[#1769AA]">
                <span>About the Facility</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>Institutional Student Housing</span>
              </p>
              <h2
                id="about-heading"
                className="mt-2 text-3xl font-normal tracking-tight text-[#102A43] sm:text-4xl [text-wrap:balance]"
              >
                {siteConfig.aboutHeading}
              </h2>

              <p className="mt-5 text-base leading-relaxed text-[#243447]">
                {siteConfig.aboutDescription}
              </p>

              <div className="mt-6 border-l-2 border-[#1769AA] pl-4">
                <h3 className="text-sm font-semibold text-[#102A43]">
                  Accurate Facility Representation
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#243447]/85">
                  While public map directories may categorize the building under general government
                  or institutional listings, BCM BOYS HOSTEL 296 operates specifically as a boys
                  hostel and student accommodation facility. Prospective residents and parents are
                  encouraged to schedule a visit or call management directly to verify current room
                  openings and admission guidelines.
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-[#102A43]/12 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#102A43]">
                  Admission &amp; Check-In Requirements
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#243447]/85">
                  {siteConfig.admissionRequirements}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#102A43]/10 pt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => navigateToBooking('Hostel visit')}
                    className="font-semibold text-[#1769AA] hover:underline"
                  >
                    Schedule an In-Person Visit →
                  </button>
                  <button
                    type="button"
                    onClick={() => openAdminSection('settings')}
                    className="text-[#243447]/70 hover:text-[#102A43] hover:underline"
                  >
                    Management: Edit Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Large Property Photograph + Smaller Supporting Image (6 cols) */}
            <div className="space-y-5 lg:col-span-6">
              <PropertyVisualFrame
                variant="about-main"
                imageUrl={siteConfig.aboutMainPhotoUrl}
                altText="Primary property view of BCM BOYS HOSTEL 296 in Chikkaballapura"
                title="Main Hostel Building & Entrance"
                categoryLabel="Primary Property View"
                aspectClass="aspect-[16/10]"
                isAdmin={isAdmin}
                onManageUpload={() => openAdminSection('gallery')}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-12">
                <div className="sm:col-span-7">
                  <PropertyVisualFrame
                    variant="about-sub"
                    imageUrl={siteConfig.aboutSecondaryPhotoUrl}
                    altText="Supporting interior or study space view at BCM BOYS HOSTEL 296"
                    title="Student Living & Study Environment"
                    categoryLabel="Interior Space"
                    aspectClass="aspect-[16/10]"
                    isAdmin={isAdmin}
                    onManageUpload={() => openAdminSection('gallery')}
                  />
                </div>
                <div className="flex flex-col justify-between rounded-xl border border-[#102A43]/12 bg-white p-5 sm:col-span-5">
                  <div>
                    <p className="text-xs font-medium text-[#1769AA]">Direct Contact</p>
                    <p className="mt-1 text-sm font-semibold text-[#102A43]">
                      Looking for accommodation in Chikkaballapura?
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#243447]/80">
                      Check current availability or speak directly with hostel management.
                    </p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <a
                      href={cleanPhoneHref}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E7D5B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2E7D5B]/90 whitespace-nowrap"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span className="font-mono-tabular">Call {siteConfig.phone}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => navigateToBooking('Accommodation enquiry')}
                      className="w-full rounded-lg border border-[#102A43]/20 px-3 py-2 text-xs font-semibold text-[#102A43] hover:bg-[#E8F0F7] whitespace-nowrap"
                    >
                      Check Availability
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          9. ROOMS / ACCOMMODATION SECTION
          ===================================================================== */}
      <section
        id="rooms"
        aria-labelledby="rooms-heading"
        className="border-t border-[#102A43]/10 bg-white py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 border-b border-[#102A43]/10 pb-8 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#1769AA]">
                <span>Accommodation Options</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>Updated by Hostel Management</span>
              </p>
              <h2
                id="rooms-heading"
                className="mt-2 text-3xl font-normal tracking-tight text-[#102A43] sm:text-4xl [text-wrap:balance]"
              >
                Student Rooms &amp; Accommodation
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#243447]/85">
                Room capacities, fee structures, and current bed openings are confirmed directly by
                hostel administration upon enquiry.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAdminSection('rooms')}
              className="self-start rounded-lg border border-[#102A43]/15 bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#102A43] hover:bg-[#E8F0F7] sm:self-auto whitespace-nowrap"
            >
              Management: Edit Rooms &amp; Pricing
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
            {rooms.map((room) => (
              <article
                key={room.id}
                className="flex flex-col justify-between rounded-xl border border-[#102A43]/12 bg-[#F8FAFC] p-5"
              >
                <div>
                  {/* Room Photograph / Placeholder */}
                  <PropertyVisualFrame
                    variant="room"
                    imageUrl={room.photoUrl}
                    altText={room.photoAlt}
                    title={room.name}
                    categoryLabel={room.status}
                    aspectClass="aspect-[16/10]"
                    isAdmin={isAdmin}
                    onManageUpload={() => openAdminSection('rooms')}
                  />

                  {/* Unboxed Status & Verification Kicker */}
                  <div className="mt-4 flex items-center gap-2 text-xs text-[#243447]/80">
                    <span
                      className={`font-semibold ${
                        room.status === 'Available'
                          ? 'text-[#2E7D5B]'
                          : room.status === 'Unavailable'
                          ? 'text-red-700'
                          : 'text-[#1769AA]'
                      }`}
                    >
                      {room.status}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {room.verified ? 'Verified Details' : 'Confirm Details with Management'}
                    </span>
                  </div>

                  {/* Card Leads Directly With Primary Title */}
                  <h3 className="mt-1.5 text-lg font-semibold text-[#102A43]">{room.name}</h3>

                  <dl className="mt-4 space-y-2.5 border-t border-[#102A43]/10 pt-4 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#243447]/70">Occupancy:</dt>
                      <dd className="text-right font-medium text-[#102A43]">{room.occupancy}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#243447]/70">Price / Fee:</dt>
                      <dd className="text-right font-semibold text-[#102A43]">{room.priceText}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#243447]/70">Deposit:</dt>
                      <dd className="text-right font-medium text-[#243447]">{room.depositText}</dd>
                    </div>
                  </dl>

                  <p className="mt-3 border-t border-[#102A43]/10 pt-3 text-xs leading-relaxed text-[#243447]/80">
                    {room.facilitiesText}
                  </p>
                </div>

                <div className="mt-6 pt-2">
                  <button
                    type="button"
                    onClick={() => navigateToBooking('Accommodation enquiry', room.name)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#102A43] px-4 py-2.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#1769AA] whitespace-nowrap"
                  >
                    <span>Check Availability</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          8. FACILITIES SECTION
          ===================================================================== */}
      <section
        id="facilities"
        aria-labelledby="facilities-heading"
        className="border-t border-[#102A43]/10 bg-[#F8FAFC] py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 border-b border-[#102A43]/10 pb-8 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#1769AA]">
                <span>Facility Checklist</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>Transparent Verification Status</span>
              </p>
              <h2
                id="facilities-heading"
                className="mt-2 text-3xl font-normal tracking-tight text-[#102A43] sm:text-4xl [text-wrap:balance]"
              >
                Hostel Facilities &amp; Student Amenities
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#243447]/85">
                We never display unverified amenities as fact. Items marked{' '}
                <strong className="font-semibold text-[#102A43]">"Confirm with management"</strong>{' '}
                should be verified during your enquiry or hostel visit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAdminSection('facilities')}
              className="self-start rounded-lg border border-[#102A43]/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#102A43] hover:bg-[#E8F0F7] sm:self-auto whitespace-nowrap"
            >
              Management: Verify / Edit Facilities
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {activeFacilities.map((fac) => {
              const IconComponent = FACILITY_ICONS[fac.iconName] || CheckCircle;
              return (
                <div
                  key={fac.id}
                  className="flex flex-col justify-between rounded-xl border border-[#102A43]/12 bg-white p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <IconComponent className="h-5 w-5 text-[#1769AA]" />
                      <span
                        className={`text-xs font-medium ${
                          fac.verified ? 'text-[#2E7D5B]' : 'text-[#243447]/70'
                        }`}
                      >
                        {fac.verified ? 'Verified by Management' : 'Confirm with management'}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-[#102A43]">{fac.name}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#243447]/80">
                      {fac.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversion Microcopy */}
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-xl border border-[#102A43]/12 bg-white p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-[#102A43]">
                Want to confirm specific facility details before applying?
              </p>
              <p className="mt-0.5 text-xs text-[#243447]/80">
                Schedule a visit to inspect the hostel in person or speak directly with management.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigateToBooking('Hostel visit')}
                className="rounded-lg bg-[#102A43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1769AA] whitespace-nowrap"
              >
                Schedule a Visit
              </button>
              <a
                href={cleanPhoneHref}
                className="rounded-lg border border-[#102A43]/20 px-4 py-2.5 text-xs font-semibold text-[#102A43] hover:bg-[#E8F0F7] whitespace-nowrap"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          10 & 11. APPOINTMENT / ENQUIRY BOOKING SYSTEM
          ===================================================================== */}
      <BookingSection
        initialRequirement={bookingReqType}
        initialRoomType={bookingRoomType}
      />

      {/* =====================================================================
          13. GALLERY SECTION (Masonry-Style with Lightbox & Categories)
          ===================================================================== */}
      <section id="gallery" aria-labelledby="gallery-heading" className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 border-b border-[#102A43]/10 pb-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#1769AA]">
                <span>Visual Inspection</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>Real Photographs &amp; Honest Placeholders</span>
              </p>
              <h2
                id="gallery-heading"
                className="mt-2 text-3xl font-normal tracking-tight text-[#102A43] sm:text-4xl [text-wrap:balance]"
              >
                Property &amp; Living Space Gallery
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#243447]/85">
                Browse verified property photographs or view designated category slots awaiting
                management upload. We never use stock hotel photos to misrepresent the hostel.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openAdminSection('gallery')}
              className="self-start rounded-lg border border-[#102A43]/15 bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#102A43] hover:bg-[#E8F0F7] lg:self-auto whitespace-nowrap"
            >
              Management: Upload Property Photos
            </button>
          </div>

          {/* Interactive Category Filter Control */}
          <div
            role="group"
            aria-label="Gallery category filter"
            className="mt-6 flex flex-wrap items-center gap-1.5 rounded-lg bg-[#E8F0F7]/70 p-1.5"
          >
            {GALLERY_FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setGalleryCategory(cat)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 whitespace-nowrap ${
                  galleryCategory === cat
                    ? 'bg-[#102A43] text-white shadow-2xs'
                    : 'text-[#243447] hover:text-[#102A43]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Asymmetric Masonry-Style Grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-12">
            {filteredGallery.map((item, idx) => {
              const spanClass =
                idx % 3 === 0
                  ? 'lg:col-span-7'
                  : idx % 3 === 1
                  ? 'lg:col-span-5'
                  : 'lg:col-span-6';
              return (
                <div key={item.id} className={spanClass}>
                  <PropertyVisualFrame
                    variant="gallery"
                    imageUrl={item.imageUrl}
                    altText={item.altText}
                    title={item.title}
                    categoryLabel={item.category}
                    aspectClass="aspect-[16/10]"
                    isAdmin={isAdmin}
                    onExpand={() => setLightboxItem(item)}
                    onManageUpload={() => openAdminSection('gallery')}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          14. LOCATION SECTION
          ===================================================================== */}
      <section
        id="location"
        aria-labelledby="location-heading"
        className="border-t border-[#102A43]/10 bg-[#F8FAFC] py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Location Details (5 cols) */}
            <div className="lg:col-span-5">
              <p className="text-xs font-medium text-[#1769AA]">
                <span>Verified Address &amp; Navigation</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span className="font-mono-tabular">Plus Code: CPJH+943</span>
              </p>
              <h2
                id="location-heading"
                className="mt-2 text-3xl font-normal tracking-tight text-[#102A43] sm:text-4xl [text-wrap:balance]"
              >
                Location &amp; Directions
              </h2>

              <div className="mt-6 rounded-xl border border-[#102A43]/12 bg-white p-6">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#1769AA]" />
                  <div>
                    <h3 className="text-base font-semibold text-[#102A43]">
                      {siteConfig.hostelName}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[#243447]">
                      {siteConfig.address}
                    </p>
                  </div>
                </div>

                <dl className="mt-5 space-y-2.5 border-t border-[#102A43]/10 pt-4 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-[#243447]/70">Town / District:</dt>
                    <dd className="font-medium text-[#102A43]">Chikkaballapur, Karnataka</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#243447]/70">PIN Code:</dt>
                    <dd className="font-mono-tabular font-medium text-[#102A43]">562101</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#243447]/70">Telephone:</dt>
                    <dd className="font-mono-tabular font-semibold text-[#102A43]">
                      {siteConfig.phone}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#243447]/70">Visiting Hours:</dt>
                    <dd className="text-right font-medium text-[#243447]">
                      {siteConfig.openingHours}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={GOOGLE_MAPS_DIRECTIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#102A43] px-4 py-3 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#1769AA] whitespace-nowrap"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Get Directions</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => navigateToBooking('Hostel visit')}
                    className="inline-flex items-center justify-center rounded-lg border border-[#102A43]/20 bg-[#F8FAFC] px-4 py-3 text-xs font-semibold text-[#102A43] hover:bg-[#E8F0F7] whitespace-nowrap"
                  >
                    Schedule Visit
                  </button>
                </div>
              </div>
            </div>

            {/* Embedded Google Map (7 cols) */}
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-xl border border-[#102A43]/15 bg-white">
                <iframe
                  title="Google Maps location for BCM BOYS HOSTEL 296, Chikkaballapur, Karnataka 562101"
                  src="https://www.google.com/maps?q=CPJH%2B943,+Chikkaballapur,+Karnataka+562101,+India&output=embed"
                  className="h-80 w-full border-0 sm:h-96"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          16. FAQ SECTION (Expandable Component)
          ===================================================================== */}
      <section
        id="faq"
        aria-labelledby="faq-heading"
        className="border-t border-[#102A43]/10 bg-white py-16 sm:py-24"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 border-b border-[#102A43]/10 pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-medium text-[#1769AA]">
                <span>Frequently Asked Questions</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>Student &amp; Parent Information</span>
              </p>
              <h2
                id="faq-heading"
                className="mt-2 text-3xl font-normal tracking-tight text-[#102A43] sm:text-4xl"
              >
                Common Questions About Staying With Us
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openAdminSection('settings')}
              className="self-start rounded-lg border border-[#102A43]/15 bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#102A43] hover:bg-[#E8F0F7] sm:self-auto whitespace-nowrap"
            >
              Management: Edit FAQs
            </button>
          </div>

          <div className="mt-8 divide-y divide-[#102A43]/10 border-b border-[#102A43]/10">
            {faqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="py-4">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="flex w-full items-center justify-between gap-4 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
                  >
                    <span className="text-base font-semibold text-[#102A43]">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 shrink-0 text-[#1769AA]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-[#243447]/60" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="mt-2 pr-8 pb-2">
                      <p className="text-sm leading-relaxed text-[#243447]">{faq.answer}</p>
                      <p className="mt-2 text-xs text-[#243447]/65">
                        {faq.isVerifiedAnswer
                          ? 'Verified Hostel Procedure'
                          : 'Unverified — Please confirm directly with management at +91 74114 39441'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          15. CONTACT SECTION
          ===================================================================== */}
      <section
        id="contact"
        aria-labelledby="contact-heading"
        className="border-t border-[#102A43]/10 bg-[#102A43] py-16 text-white sm:py-24"
      >
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-medium tracking-wide text-[#E8F0F7]/80">
            <span>BCM BOYS HOSTEL 296</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>Chikkaballapura, Karnataka 562101</span>
          </p>

          <h2
            id="contact-heading"
            className="mt-3 text-3xl font-normal tracking-tight text-white sm:text-5xl [text-wrap:balance]"
          >
            Have Questions About Staying With Us?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#E8F0F7]/90">
            Contact the hostel to enquire about accommodation, availability, visits, and
            admission-related information.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={cleanPhoneHref}
              className="inline-flex min-h-[44px] items-center gap-2.5 rounded-lg bg-[#2E7D5B] px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#2E7D5B]/90 whitespace-nowrap"
            >
              <Phone className="h-4 w-4" />
              <span>Call Now · {siteConfig.phone}</span>
            </a>

            <button
              type="button"
              onClick={() => navigateToBooking('Accommodation enquiry')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-[#102A43] transition-colors duration-150 hover:bg-[#E8F0F7] whitespace-nowrap"
            >
              <span>Send Enquiry</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Only display email if supplied by management */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#E8F0F7]/80">
            <span>Address: {siteConfig.address}</span>
            <span>
              Phone: <strong className="font-mono-tabular text-white">{siteConfig.phone}</strong>
            </span>
            {siteConfig.email && siteConfig.email.trim().length > 0 && (
              <span>
                Email: <strong className="text-white">{siteConfig.email}</strong>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          23. QUIET FOOTER
          ===================================================================== */}
      <footer className="border-t border-white/10 bg-[#0B1D2E] py-12 text-[#E8F0F7]/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="font-serif-display text-xl text-white">{siteConfig.hostelName}</p>
              <p className="mt-2 text-xs leading-relaxed text-[#E8F0F7]/75">
                {siteConfig.address}
              </p>
              <p className="mt-2 text-xs">
                Phone:{' '}
                <a
                  href={cleanPhoneHref}
                  className="font-mono-tabular font-semibold text-white hover:underline"
                >
                  {siteConfig.phone}
                </a>
              </p>
              <div className="mt-4">
                <a
                  href={GOOGLE_MAPS_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:underline"
                >
                  <Navigation className="h-3.5 w-3.5 text-[#2E7D5B]" />
                  <span>Get Directions on Google Maps</span>
                </a>
              </div>
            </div>

            <div className="md:col-span-4">
              <p className="text-xs font-semibold text-white">Navigation</p>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <li>
                  <a href="#home" className="hover:text-white">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#rooms" className="hover:text-white">
                    Rooms
                  </a>
                </li>
                <li>
                  <a href="#facilities" className="hover:text-white">
                    Facilities
                  </a>
                </li>
                <li>
                  <a href="#gallery" className="hover:text-white">
                    Gallery
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openAdminSection('enquiries')}
                    className="text-left hover:text-white"
                  >
                    Admin Console
                  </button>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <p className="text-xs font-semibold text-white">Legal &amp; Information Policy</p>
              <ul className="mt-3 space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal('privacy')}
                    className="hover:text-white hover:underline"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal('terms')}
                    className="hover:text-white hover:underline"
                  >
                    Terms of Use &amp; Enquiry Notice
                  </button>
                </li>
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-[#E8F0F7]/60">
                All accommodation details, room capacities, and appointments are subject to
                direct verification by hostel management.
              </p>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-xs text-[#E8F0F7]/60">
            © {new Date().getFullYear()} {siteConfig.hostelName}, Chikkaballapura, Karnataka
            562101. All rights reserved.
          </div>
        </div>
      </footer>

      {/* =====================================================================
          DESKTOP FLOATING CALL BUTTON & MOBILE PERSISTENT BOTTOM CTA BAR
          (Respects 15% Mobile Sticky Cap)
          ===================================================================== */}
      <a
        href={cleanPhoneHref}
        aria-label={`Call ${siteConfig.hostelName} at ${siteConfig.phone}`}
        className="fixed right-6 bottom-6 z-30 hidden items-center gap-2.5 rounded-full bg-[#2E7D5B] px-5 py-3 text-xs font-semibold text-white shadow-lg transition-transform duration-150 hover:scale-[1.02] md:inline-flex whitespace-nowrap"
      >
        <Phone className="h-4 w-4" />
        <span className="font-mono-tabular">{siteConfig.phone}</span>
      </a>

      {/* Persistent Mobile Bottom CTA Bar (h-12, < 7% mobile viewport height) */}
      <div className="fixed inset-x-0 bottom-0 z-40 grid h-12 grid-cols-3 border-t border-[#102A43]/15 bg-white md:hidden">
        <a
          href={cleanPhoneHref}
          className="flex items-center justify-center gap-1.5 border-r border-[#102A43]/10 text-xs font-semibold text-[#102A43] active:bg-[#E8F0F7]"
        >
          <Phone className="h-3.5 w-3.5 text-[#2E7D5B]" />
          <span>Call</span>
        </a>
        <a
          href={GOOGLE_MAPS_DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 border-r border-[#102A43]/10 text-xs font-semibold text-[#102A43] active:bg-[#E8F0F7]"
        >
          <Navigation className="h-3.5 w-3.5 text-[#1769AA]" />
          <span>Directions</span>
        </a>
        <button
          type="button"
          onClick={() => navigateToBooking('Accommodation enquiry')}
          className="flex items-center justify-center gap-1.5 bg-[#102A43] text-xs font-semibold text-white active:bg-[#1769AA]"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Enquire</span>
        </button>
      </div>

      {/* =====================================================================
          ACCESSIBLE LIGHTBOX MODAL FOR GALLERY
          ===================================================================== */}
      {lightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItem.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#102A43]/90 p-4"
        >
          <div className="relative w-full max-w-4xl rounded-xl border border-white/15 bg-[#0B1D2E] p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#E8F0F7]/75">
                  {lightboxItem.category} ·{' '}
                  {lightboxItem.isRealPhoto
                    ? 'Verified Property Photograph'
                    : 'Property Photograph Placeholder'}
                </p>
                <h3 className="text-lg font-semibold text-white">{lightboxItem.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                aria-label="Close lightbox"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <PropertyVisualFrame
              variant="gallery"
              imageUrl={lightboxItem.imageUrl}
              altText={lightboxItem.altText}
              title={lightboxItem.title}
              categoryLabel={lightboxItem.category}
              aspectClass="aspect-[16/9]"
              isAdmin={isAdmin}
              onManageUpload={() => {
                setLightboxItem(null);
                openAdminSection('gallery');
              }}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          PRIVACY POLICY & TERMS MODAL
          ===================================================================== */}
      {legalModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={legalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#102A43]/80 p-4"
        >
          <div className="w-full max-w-xl rounded-xl border border-[#102A43]/15 bg-white p-6">
            <div className="flex items-center justify-between border-b border-[#102A43]/10 pb-3">
              <h3 className="text-lg font-semibold text-[#102A43]">
                {legalModal === 'privacy'
                  ? 'Privacy Policy — BCM BOYS HOSTEL 296'
                  : 'Terms of Use & Enquiry Disclaimer'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="rounded-lg p-1.5 text-[#243447] hover:bg-[#E8F0F7]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-[#243447]">
              {legalModal === 'privacy' ? (
                <>
                  <p>
                    BCM BOYS HOSTEL 296 collects only the information voluntarily submitted through
                    the accommodation and visit enquiry form (such as applicant name, student name,
                    phone number, optional email, and preferred visit date).
                  </p>
                  <p>
                    Submitted contact details are strictly isolated and accessible only to
                    authorized hostel management for the purpose of responding to your enquiry,
                    confirming room availability, and scheduling visits.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Submitting an online enquiry or visit request does not constitute an automatic
                    room reservation or confirmed appointment. All bookings and visit times are
                    subject to confirmation by BCM BOYS HOSTEL 296 management.
                  </p>
                  <p>
                    Amenities or room details marked "Confirm with management" are placeholders
                    pending verification by the property owner and should be confirmed directly by
                    calling {siteConfig.phone}.
                  </p>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="rounded-lg bg-[#102A43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1769AA]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <HostelProvider>
      <HostelWebsiteContent />
    </HostelProvider>
  );
}
