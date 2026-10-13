import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";

import { can } from "@/lib/roles";
import type { RoleName } from "@/lib/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Every role lands here; the dashboard renders the appropriate view. */
export const HOME_ROUTE = "/dashboard";

export const ROUTES = {
  home: HOME_ROUTE,
  login: "/login",
} as const;

const OVERVIEW: NavItem = {
  title: "Overview",
  href: HOME_ROUTE,
  icon: LayoutDashboard,
};

/**
 * Navigation is derived from the permissions the backend actually grants, so a
 * role never sees a link whose endpoint would answer 403. The backend remains
 * the authority — these lists only shape the menu.
 */
export function navigationFor(role: RoleName): NavGroup[] {
  if (role === "STUDENT") {
    return [
      { label: "Overview", items: [OVERVIEW] },
      {
        label: "Academics",
        items: [
          { title: "Course catalog", href: "/catalog", icon: BookOpen },
          {
            title: "My enrollments",
            href: "/my-enrollments",
            icon: ClipboardList,
          },
        ],
      },
    ];
  }

  if (role === "INSTRUCTOR") {
    return [
      { label: "Overview", items: [OVERVIEW] },
      {
        label: "Teaching",
        items: [
          { title: "My courses", href: "/my-courses", icon: GraduationCap },
        ],
      },
    ];
  }

  // ADMIN and SUPER_ADMIN share the academic-management surface. These entries
  // are built from the same capability checks the routes and actions use.
  const academics: NavItem[] = [];

  if (can.manageCourses(role) || can.viewCourseCatalog(role)) {
    academics.push({ title: "Courses", href: "/courses", icon: BookOpen });
  }

  if (can.manageSemesters(role)) {
    academics.push({
      title: "Semesters",
      href: "/semesters",
      icon: CalendarDays,
    });
  }

  if (can.viewAllEnrollments(role)) {
    academics.push({
      title: "Enrollments",
      href: "/enrollments",
      icon: Users,
    });
  }

  return [
    { label: "Overview", items: [OVERVIEW] },
    { label: "Academics", items: academics },
  ];
}

export function isPathWithin(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The `next` destination a guarded route handed to the login page, if it is safe
 * to follow. Only paths on this origin are accepted: a leading `//` is a
 * protocol-relative host, and a backslash is normalised to `/` by browsers, so
 * `/\example.com` would leave the site. `/login` itself is refused to keep a
 * signed-in visitor from bouncing back to the form.
 */
export function safeNextPath(search: string): string | null {
  const next = new URLSearchParams(search).get("next");

  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  if (next.includes("\\")) return null;
  if (isPathWithin(next, ROUTES.login)) return null;

  return next;
}

export interface Crumb {
  title: string;
  href?: string;
}

/**
 * Section-level trail only. Detail routes show their own record title in a page
 * header, so the trail never has to render a raw id.
 */
export function breadcrumbsFor(pathname: string, role: RoleName): Crumb[] {
  if (pathname === HOME_ROUTE) return [{ title: OVERVIEW.title }];

  const section = navigationFor(role)
    .flatMap((group) => group.items)
    .find((item) => item.href !== HOME_ROUTE && isPathWithin(pathname, item.href));

  return section
    ? [{ title: OVERVIEW.title, href: HOME_ROUTE }, { title: section.title }]
    : [{ title: OVERVIEW.title, href: HOME_ROUTE }];
}
