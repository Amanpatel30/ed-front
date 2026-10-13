import type { RoleName } from "@/lib/types";

export const ROLE_LABELS: Record<RoleName, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
};

/**
 * UI capabilities, each naming the backend permission that actually gates it.
 * These drive navigation and action visibility only — the backend stays
 * authoritative. A hidden control is never treated as a security boundary.
 *
 * The grants below were read from the `Role_Permissions` table and confirmed
 * against live responses. Endpoints the backend does not implement yet (student
 * rosters, grade entry) are absent here even though the role holds the matching
 * permission, because no route exposes them.
 */
export const can = {
  /** COURSE_CATALOG_VIEW */
  viewCourseCatalog: (role: RoleName) => role !== "INSTRUCTOR",

  /** COURSE_CREATE_UPDATE */
  manageCourses: (role: RoleName) =>
    role === "ADMIN" || role === "SUPER_ADMIN",

  /** COURSE_ASSIGN */
  assignInstructors: (role: RoleName) =>
    role === "ADMIN" || role === "SUPER_ADMIN",

  /** SEMESTER_OPEN_CLOSE */
  manageSemesters: (role: RoleName) =>
    role === "ADMIN" || role === "SUPER_ADMIN",

  /** ENROLLMENT_VIEW_ALL */
  viewAllEnrollments: (role: RoleName) =>
    role === "ADMIN" || role === "SUPER_ADMIN",

  /** ENROLLMENT_CREATE_UPDATE_DROP */
  manageEnrollments: (role: RoleName) =>
    role === "ADMIN" || role === "SUPER_ADMIN",

  /** OWN_ENROLLMENT_VIEW */
  viewOwnEnrollments: (role: RoleName) => role === "STUDENT",

  /** OWN_ENROLLMENT_CREATE_DROP */
  selfEnroll: (role: RoleName) => role === "STUDENT",

  /** ASSIGNED_COURSE_VIEW */
  viewAssignedCourses: (role: RoleName) => role === "INSTRUCTOR",
} as const;

export const PERMISSIONS = {
  catalog: "COURSE_CATALOG_VIEW",
  semester: "SEMESTER_OPEN_CLOSE",
  enrollment: "ENROLLMENT_VIEW_ALL",
  ownEnrollment: "OWN_ENROLLMENT_VIEW",
  assignedCourses: "ASSIGNED_COURSE_VIEW",
  department: "DEPARTMENT_MANAGE",
} as const;
