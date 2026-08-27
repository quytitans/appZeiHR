import type { SVGProps } from "react";

export type IconName =
  | "personnel"
  | "contracts"
  | "benefits"
  | "attendance"
  | "users"
  | "arrow-right"
  | "logo"
  | "close"
  | "search"
  | "download"
  | "plus"
  | "chevron-left"
  | "chevron-right"
  | "upload"
  | "spinner"
  | "file-pdf"
  | "sort"
  | "edit"
  | "trash"
  | "database";

const paths: Record<IconName, JSX.Element> = {
  personnel: (
    <>
      <circle cx="9" cy="7" r="3.25" />
      <path d="M3.5 19c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M15.7 13.6c2.4.4 4.3 2.35 4.3 5.4" />
    </>
  ),
  contracts: (
    <>
      <path d="M6 3.5h8.5L19 8v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14.5 3.5V8H19" />
      <path d="M8.25 12.5h7.5M8.25 15.5h7.5M8.25 9.5h3" />
    </>
  ),
  benefits: (
    <>
      <rect x="3.5" y="9" width="17" height="10.5" rx="1.5" />
      <path d="M3.5 13.5h17" />
      <path d="M12 9v10.5" />
      <path d="M12 9c-1.4 0-3.2-.9-3.2-2.75A2.25 2.25 0 0 1 11 4c1 0 1.6.75 1.6 1.5m-.6 3.5c1.4 0 3.2-.9 3.2-2.75A2.25 2.25 0 0 0 13 4c-1 0-1.6.75-1.6 1.5" />
    </>
  ),
  attendance: (
    <>
      <circle cx="12" cy="12.5" r="8" />
      <path d="M12 8v4.5l3 2" />
      <path d="M9 3.5h6" />
    </>
  ),
  users: (
    <>
      <path d="M12 3.5 4 6.75V11c0 5 3.4 8.3 8 9.5 4.6-1.2 8-4.5 8-9.5V6.75L12 3.5Z" />
      <path d="M9.25 12.25 11 14l3.75-4" />
    </>
  ),
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  // Mark chữ "Z" (Zei Group HR) - đồng nhất với apps/frontend/public/favicon.svg
  logo: <path d="M7 8h10L7 16h10" strokeWidth={2.4} />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.5-4.5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5v11.5m0 0 4-4m-4 4-4-4" />
      <path d="M4.5 17v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  "chevron-left": <path d="M15 6l-6 6 6 6" />,
  "chevron-right": <path d="M9 6l6 6-6 6" />,
  upload: (
    <>
      <path d="M12 15.5V4m0 0 4 4m-4-4-4 4" />
      <path d="M4.5 17v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2" />
    </>
  ),
  spinner: (
    <>
      <circle cx="12" cy="12" r="8.5" opacity={0.25} />
      <path d="M20.5 12A8.5 8.5 0 0 0 12 3.5" />
    </>
  ),
  "file-pdf": (
    <>
      <path d="M6 3.5h8.5L19 8v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14.5 3.5V8H19" />
      <path d="M8 15.25h1.1a1.1 1.1 0 1 0 0-2.2H8v4.4M12 13.05v4.4h.9a1.6 1.6 0 0 0 1.6-1.6v-1.2a1.6 1.6 0 0 0-1.6-1.6H12Zm4.5 0v4.4m0-4.4h1.75M16.5 15.25h1.5" />
    </>
  ),
  sort: <path d="M8 9l4-4.5L16 9M8 15l4 4.5 4-4.5" />,
  edit: (
    <>
      <path d="M15.5 4.5 19.5 8.5 8 20H4v-4Z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 .75 12a1 1 0 0 0 1 .95h6.5a1 1 0 0 0 1-.95L18 7" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7.5" ry="3" />
      <path d="M4.5 6v12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V6" />
      <path d="M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3" />
    </>
  ),
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export function Icon({ name, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
