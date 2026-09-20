import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function S({ size = 20, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: P) => (
  <S {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.75V21h5v-6h4v6h5V9.75" />
  </S>
);

export const IconWallet = (p: P) => (
  <S {...p}>
    <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h11.5A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5z" />
    <path d="M20 10.5h-3.5a2 2 0 0 0 0 4H20" />
  </S>
);

export const IconSwap = (p: P) => (
  <S {...p}>
    <path d="m16 3 4 4-4 4" />
    <path d="M20 7H7" />
    <path d="m8 21-4-4 4-4" />
    <path d="M4 17h13" />
  </S>
);

export const IconSend = (p: P) => (
  <S {...p}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4z" />
  </S>
);

export const IconUsers = (p: P) => (
  <S {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </S>
);

export const IconUser = (p: P) => (
  <S {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </S>
);

export const IconPlus = (p: P) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);

export const IconX = (p: P) => (
  <S {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </S>
);

export const IconSearch = (p: P) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </S>
);

export const IconChevronDown = (p: P) => (
  <S {...p}>
    <path d="m6 9 6 6 6-6" />
  </S>
);

export const IconDots = (p: P) => (
  <S {...p}>
    <circle cx="5" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="19" cy="12" r="1" fill="currentColor" />
  </S>
);

export const IconPencil = (p: P) => (
  <S {...p}>
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
    <path d="m15 5 4 4" />
  </S>
);

export const IconTrash = (p: P) => (
  <S {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </S>
);

export const IconClock = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </S>
);

export const IconCheck = (p: P) => (
  <S {...p}>
    <path d="M20 6 9 17l-5-5" />
  </S>
);

export const IconAlert = (p: P) => (
  <S {...p}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </S>
);

export const IconLogOut = (p: P) => (
  <S {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </S>
);

export const IconMenu = (p: P) => (
  <S {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </S>
);

export const IconEye = (p: P) => (
  <S {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </S>
);

export const IconEyeOff = (p: P) => (
  <S {...p}>
    <path d="M9.9 4.24A9.5 9.5 0 0 1 12 4c6.5 0 10 8 10 8a17.4 17.4 0 0 1-2.16 3.19" />
    <path d="M6.61 6.61A16.9 16.9 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.39-1.61" />
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M2 2l20 20" />
  </S>
);

export const IconShield = (p: P) => (
  <S {...p}>
    <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </S>
);

export const IconArrowUpRight = (p: P) => (
  <S {...p}>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </S>
);

export const IconArrowDownLeft = (p: P) => (
  <S {...p}>
    <path d="M17 7 7 17" />
    <path d="M16 17H7V8" />
  </S>
);

export const IconTrendingUp = (p: P) => (
  <S {...p}>
    <path d="m22 7-8.5 8.5-5-5L2 17" />
    <path d="M16 7h6v6" />
  </S>
);

export const IconBuilding = (p: P) => (
  <S {...p}>
    <path d="M3 21h18" />
    <path d="M5 21V8l7-5 7 5v13" />
    <path d="M9 21v-6h6v6" />
    <path d="M9 12h.01M15 12h.01M12 9h.01" />
  </S>
);

export const IconInfo = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-4M12 8h.01" />
  </S>
);

export const IconSpinner = (p: P) => (
  <S {...p} className={`animate-spin ${p.className ?? ""}`}>
    <path d="M21 12a9 9 0 1 1-6.2-8.56" />
  </S>
);

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#0F5A48" />
      <path
        d="M16 7a9.5 9.5 0 0 1 0 19M16 7a9.5 9.5 0 0 0 0 19M7 12.5h18M7 19.5h18"
        stroke="#EAF4EF"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
