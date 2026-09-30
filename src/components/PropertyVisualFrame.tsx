import React, { useState } from 'react';
import { Maximize2, Upload } from 'lucide-react';

interface PropertyVisualFrameProps {
  imageUrl?: string;
  altText: string;
  title: string;
  categoryLabel: string;
  aspectClass?: string;
  onExpand?: () => void;
  onManageUpload?: () => void;
  isAdmin?: boolean;
  variant?: 'hero' | 'about-main' | 'about-sub' | 'room' | 'gallery';
}

/**
 * Renders an authentic uploaded property photograph when provided by management,
 * or a high-craft institutional architectural schematic placeholder when no
 * verified photograph has been uploaded yet. Never fabricates property photos.
 */
export const PropertyVisualFrame: React.FC<PropertyVisualFrameProps> = ({
  imageUrl,
  altText,
  title,
  categoryLabel,
  aspectClass = 'aspect-[16/10]',
  onExpand,
  onManageUpload,
  isAdmin = false,
  variant = 'gallery',
}) => {
  const [imageError, setImageError] = useState(false);
  const hasValidPhoto = Boolean(imageUrl && imageUrl.trim().length > 0 && !imageError);

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-[#102A43]/12 bg-[#102A43] text-white ${aspectClass}`}
    >
      {hasValidPhoto ? (
        <>
          <img
            src={imageUrl}
            alt={altText}
            loading={variant === 'hero' ? 'eager' : 'lazy'}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#102A43]/85 via-[#102A43]/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-5">
            <div>
              <p className="text-xs font-medium text-[#E8F0F7]/90">
                <span>{categoryLabel}</span>
                <span aria-hidden="true" className="mx-1.5">·</span>
                <span>Verified Property Photograph</span>
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white sm:text-base">{title}</p>
            </div>
            {onExpand && (
              <button
                type="button"
                onClick={onExpand}
                aria-label={`View fullscreen photograph: ${title}`}
                className="pointer-events-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-xs transition-colors duration-150 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="relative flex h-full w-full flex-col justify-between p-5 sm:p-6">
          {/* Architectural institutional blueprint SVG background */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
            viewBox="0 0 800 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <pattern id="archGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#E8F0F7"
                  strokeWidth="0.6"
                  strokeOpacity="0.35"
                />
              </pattern>
            </defs>
            <rect width="800" height="500" fill="url(#archGrid)" />
            {/* Institutional Hostel Elevation Schematic */}
            <rect
              x="140"
              y="110"
              width="520"
              height="290"
              stroke="#E8F0F7"
              strokeWidth="1.75"
              strokeDasharray="4 4"
            />
            <line x1="100" y1="400" x2="700" y2="400" stroke="#E8F0F7" strokeWidth="2" />
            <rect x="180" y="150" width="90" height="75" stroke="#E8F0F7" strokeWidth="1.2" />
            <rect x="300" y="150" width="90" height="75" stroke="#E8F0F7" strokeWidth="1.2" />
            <rect x="420" y="150" width="90" height="75" stroke="#E8F0F7" strokeWidth="1.2" />
            <rect x="540" y="150" width="80" height="75" stroke="#E8F0F7" strokeWidth="1.2" />
            <rect x="180" y="255" width="90" height="75" stroke="#E8F0F7" strokeWidth="1.2" />
            <rect x="340" y="275" width="120" height="125" stroke="#E8F0F7" strokeWidth="1.75" />
            <line x1="400" y1="275" x2="400" y2="400" stroke="#E8F0F7" strokeWidth="1.2" />
            <rect x="530" y="255" width="90" height="75" stroke="#E8F0F7" strokeWidth="1.2" />
          </svg>

          {/* Top quiet unboxed metadata */}
          <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/15 pb-3 text-xs text-[#E8F0F7]/85">
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-white">{categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">BCM-296</span>
            </div>
            <span className="shrink-0 text-[#E8F0F7]/75">Official Photo Slot</span>
          </div>

          {/* Center honest institutional notice */}
          <div className="relative z-10 my-auto py-4">
            <p className="text-xs tracking-wide text-[#E8F0F7]/75">
              Property Photography Placeholder — Chikkaballapura, Karnataka
            </p>
            <h4 className="mt-1 text-lg font-semibold text-white sm:text-xl">{title}</h4>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[#E8F0F7]/80">
              Reserved for verified on-site photography of BCM BOYS HOSTEL 296. Management can
              upload the actual photograph directly via the Admin Console.
            </p>
          </div>

          {/* Bottom actions */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-3 text-xs text-[#E8F0F7]/80">
            <span>CPJH+943 · Chikkaballapur 562101</span>
            <div className="flex items-center gap-2">
              {isAdmin && onManageUpload && (
                <button
                  type="button"
                  onClick={onManageUpload}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1769AA] px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-[#1769AA]/90 whitespace-nowrap"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Real Photo</span>
                </button>
              )}
              {onExpand && (
                <button
                  type="button"
                  onClick={onExpand}
                  aria-label={`Inspect placeholder details: ${title}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-white/20 whitespace-nowrap"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Inspect View</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
