import type { SVGProps } from "react";

/**
 * Ijtimoiy tarmoq belgilari.
 * lucide-react v1 da brend ikonkalari olib tashlangan, shuning uchun
 * dizayndagi uslubga mos SVG'lar shu yerda saqlanadi.
 */

type IconProps = SVGProps<SVGSVGElement>;

export function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M6.94 5.5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM3.3 8.98h3.37V21H3.3V8.98Zm5.5 0h3.23v1.64h.05c.45-.85 1.55-1.75 3.19-1.75 3.41 0 4.04 2.24 4.04 5.16V21h-3.37v-5.32c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.81V21H8.8V8.98Z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TelegramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M21.74 3.3a1 1 0 0 0-1.05-.16L2.6 10.65a1 1 0 0 0 .07 1.87l4.3 1.4 1.63 5.1a1 1 0 0 0 1.66.4l2.4-2.28 4.3 3.16a1 1 0 0 0 1.57-.6l3.5-15.3a1 1 0 0 0-.29-1.1ZM9.5 14.3l-.62 3.02-1.02-3.2 8.9-6.03-7.26 6.2Z" />
    </svg>
  );
}

export function GithubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.5l-.01-1.72c-2.78.62-3.37-1.37-3.37-1.37-.46-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.11-.26-.45-1.3.09-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.02 1.63 1.02 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9l-.01 2.82c0 .28.18.6.69.5A10.27 10.27 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

export function YoutubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M22.54 6.98a2.78 2.78 0 0 0-1.95-1.97C18.88 4.55 12 4.55 12 4.55s-6.88 0-8.59.46c-.94.25-1.68 1-1.93 1.97C1 8.7 1 12.28 1 12.28s0 3.58.48 5.3c.25.96 1 1.72 1.93 1.97 1.71.46 8.59.46 8.59.46s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.97c.47-1.72.47-5.3.47-5.3s0-3.58-.47-5.3ZM9.75 15.57V8.99l5.75 3.29-5.75 3.29Z" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

const ICONS = {
  linkedin: LinkedinIcon,
  instagram: InstagramIcon,
  telegram: TelegramIcon,
  github: GithubIcon,
  youtube: YoutubeIcon,
  facebook: FacebookIcon,
} as const;

export type SocialPlatform = keyof typeof ICONS;

export const SOCIAL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  telegram: "Telegram",
  github: "GitHub",
  youtube: "YouTube",
  facebook: "Facebook",
};

/** Platforma nomiga mos ikonka; noma'lum platforma uchun null. */
export function socialIcon(platform: string) {
  return ICONS[platform.toLowerCase() as SocialPlatform] ?? null;
}
