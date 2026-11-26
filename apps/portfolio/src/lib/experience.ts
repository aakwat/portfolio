export interface Role {
  title: string;
  org: string;
  // ISO year-month; `to` is null while the role is current.
  from: string;
  to: string | null;
  line: string;
}

// From the resume, newest first. Only the current role's end ever changes.
export const roles: readonly Role[] = [
  {
    title: "Full-Stack Developer",
    org: "IT Wizard Co., Ltd",
    from: "2024-04",
    to: null,
    line: "Enterprise web apps on Korea's eGovFramework, the servers they run on, and drawing games that teach Korean.",
  },
  {
    title: "Full-Stack Developer",
    org: "In-house e-commerce",
    from: "2023-11",
    to: "2024-04",
    line: "Shop features end to end, and releases moved onto automated pipelines.",
  },
  {
    title: "Frontend Developer",
    org: "Freelance / contract",
    from: "2022-03",
    to: "2023-01",
    line: "Fast, accessible interfaces for clients abroad, delivered on time.",
  },
];

const monthYear = new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" });

// "2024-04" -> "Apr 2024".
export function shortDate(isoMonth: string): string {
  return monthYear.format(new Date(`${isoMonth}-01T00:00:00Z`));
}
