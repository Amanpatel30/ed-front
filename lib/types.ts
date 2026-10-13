/**
 * Response and request types mirroring the EduCore API contract.
 *
 * The backend serialises bigint primary keys through `pg`, so every `id` field
 * (and every foreign key) arrives as a string, not a number.
 */

export type RoleName = "SUPER_ADMIN" | "ADMIN" | "INSTRUCTOR" | "STUDENT";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  status: string;
}

export interface SessionResponse {
  message: string;
  accessToken: string;
  tabContext: string;
  user: AuthUser;
}

/**
 * Public Student registration. There is no `role` field: the API decides the
 * role, so the client cannot ask for an administrator or instructor account.
 */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/** Only success is relied upon; the API issues no session, so the visitor signs in. */
export interface RegisterResponse {
  message: string;
}

export interface DepartmentRef {
  id: string;
  name: string;
  code: string;
}

/* --------------------------------------------------------------- pagination */

/**
 * Sent to the list endpoints. The API only adds page metadata when the request
 * carries `page` or `limit`, so omitting both keeps the plain list response.
 */
export interface PageParams {
  page?: number;
  limit?: number;
}

export interface TableQueryParams extends PageParams {
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  [key: string]: unknown;
}

/** Present on list responses only when pagination was requested. */
export interface PageMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface CourseListParams extends PageParams {
  search?: string;
  departmentId?: string;
  isActive?: boolean | string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface SemesterListParams extends PageParams {
  search?: string;
  status?: SemesterStatus | string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface EnrollmentListParams extends PageParams {
  search?: string;
  status?: EnrollmentStatus | string;
  semesterId?: string;
  courseId?: string;
  sort?: string;
  order?: "asc" | "desc";
}

/* ------------------------------------------------------------------ courses */

export interface Course {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  credits: number;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  department?: DepartmentRef;
}

export interface AssignedCourse extends Course {
  instructors: {
    id: string;
    employeeCode: string;
    designation: string | null;
    CourseInstructor: { assignedAt: string };
  }[];
}

export interface CoursesResponse extends PageMeta {
  count: number;
  courses: Course[];
}

export interface AssignedCoursesResponse extends PageMeta {
  count: number;
  courses: AssignedCourse[];
}

export interface CourseResponse {
  course: Course;
}

export interface CreateCourseInput {
  departmentId: string;
  code: string;
  name: string;
  credits: number;
  capacity?: number;
}

export type UpdateCourseInput = Partial<CreateCourseInput> & {
  isActive?: boolean;
};

/* ---------------------------------------------------------------- semesters */

export type SemesterStatus = "UPCOMING" | "OPEN" | "CLOSED";

export interface Semester {
  id: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: SemesterStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SemestersResponse extends PageMeta {
  count: number;
  semesters: Semester[];
}

export interface SemesterResponse {
  semester: Semester;
}

export interface CreateSemesterInput {
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status?: SemesterStatus;
}

export type UpdateSemesterInput = Partial<Omit<CreateSemesterInput, "status">>;

/* -------------------------------------------------------------- enrollments */

export type EnrollmentStatus = "ACTIVE" | "DROPPED";

/** Present on admin/oversight responses only. */
export interface EnrollmentStudent {
  id: string;
  studentCode: string;
  status: string;
  user: { id: string; name: string; email: string };
}

/**
 * Shape returned by the student self-service endpoints. `course.department` and
 * `semester.startDate`/`endDate` are only populated on list responses, so the
 * single-enrollment view is typed with them optional.
 */
export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  semesterId: string;
  enrollmentDate: string;
  status: EnrollmentStatus;
  grade: string | null;
  droppedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student?: EnrollmentStudent;
  course: {
    id: string;
    code: string;
    name: string;
    credits: number;
    department?: DepartmentRef;
  };
  semester: {
    id: string;
    name: string;
    academicYear: string;
    startDate?: string;
    endDate?: string;
    status: SemesterStatus;
  };
}

export interface EnrollmentsResponse extends PageMeta {
  count: number;
  enrollments: Enrollment[];
}

export interface EnrollmentResponse {
  enrollment: Enrollment;
}

export interface EnrollmentMutationResponse {
  message: string;
  /** The mutation returns the row alone; it carries no course, semester or student. */
  enrollment: Omit<Enrollment, "student" | "course" | "semester">;
}

export interface CreateEnrollmentInput {
  studentId: string;
  courseId: string;
  semesterId: string;
}

export interface UpdateEnrollmentInput {
  studentId?: string;
  courseId?: string;
  semesterId?: string;
  enrollmentDate?: string;
}

export interface SelfEnrollmentInput {
  courseId: string;
  semesterId: string;
}

/* ------------------------------------------------------- courses instructors */

export interface AssignmentResponse {
  message: string;
  assignment: { id: string; courseId: string; instructorId: string };
}

/* ------------------------------------------------------------- departments */

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentsResponse extends PageMeta {
  count: number;
  departments: Department[];
}

export interface DepartmentResponse {
  department: Department;
}

export interface DepartmentListParams extends PageParams {
  isActive?: boolean;
  search?: string;
}
