import { baseApi } from "@/lib/api/baseApi";
import type {
  AssignedCoursesResponse,
  AssignmentResponse,
  CourseResponse,
  CoursesResponse,
  CreateCourseInput,
  PageParams,
  UpdateCourseInput,
} from "@/lib/types";

export const coursesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /api/courses/public — public read-only courses catalogue (no auth required). */
    publicCourses: build.query<CoursesResponse, PageParams | void>({
      query: (params) => ({ url: "/courses/public", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.courses.map((course) => ({
                type: "Course" as const,
                id: course.id,
              })),
              { type: "Course" as const, id: "LIST" },
            ]
          : [{ type: "Course" as const, id: "LIST" }],
    }),

    /** GET /api/courses/public/:id — public course details (no auth required). */
    publicCourseById: build.query<CourseResponse, string>({
      query: (id) => `/courses/public/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Course", id }],
    }),

    /** GET /api/courses/catalog — requires COURSE_CATALOG_VIEW. */
    courseCatalog: build.query<CoursesResponse, PageParams | void>({
      query: (params) => ({ url: "/courses/catalog", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.courses.map((course) => ({
                type: "Course" as const,
                id: course.id,
              })),
              { type: "Course" as const, id: "LIST" },
            ]
          : [{ type: "Course" as const, id: "LIST" }],
    }),

    /** GET /api/courses/:id — requires COURSE_CATALOG_VIEW. */
    courseById: build.query<CourseResponse, string>({
      query: (id) => `/courses/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Course", id }],
    }),

    /** GET /api/courses/instructors/me/courses — requires ASSIGNED_COURSE_VIEW. */
    assignedCourses: build.query<AssignedCoursesResponse, PageParams | void>({
      query: (params) => ({
        url: "/courses/instructors/me/courses",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.courses.map((course) => ({
                type: "Course" as const,
                id: course.id,
              })),
              { type: "AssignedCourse" as const, id: "LIST" },
            ]
          : [{ type: "AssignedCourse" as const, id: "LIST" }],
    }),

    /** POST /api/courses — requires COURSE_CREATE_UPDATE. */
    createCourse: build.mutation<CourseResponse, CreateCourseInput>({
      query: (body) => ({ url: "/courses", method: "POST", body }),
      invalidatesTags: [
        { type: "Course", id: "LIST" },
        { type: "AssignedCourse", id: "LIST" },
      ],
    }),

    /** PUT /api/courses/:id — requires COURSE_CREATE_UPDATE. */
    updateCourse: build.mutation<
      CourseResponse,
      { id: string; body: UpdateCourseInput }
    >({
      query: ({ id, body }) => ({ url: `/courses/${id}`, method: "PUT", body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Course", id },
        { type: "Course", id: "LIST" },
      ],
    }),

    /**
     * DELETE /api/courses/:id — requires COURSE_CREATE_UPDATE.
     * The backend deactivates the course rather than removing the row, so the
     * catalogue and assigned-course lists are invalidated too.
     */
    deleteCourse: build.mutation<void, string>({
      query: (id) => ({ url: `/courses/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Course", id },
        { type: "Course", id: "LIST" },
        { type: "AssignedCourse", id: "LIST" },
      ],
    }),

    /** POST /api/courses/:courseId/instructors — requires COURSE_ASSIGN. */
    assignInstructor: build.mutation<
      AssignmentResponse,
      { courseId: string; instructorId: string }
    >({
      query: ({ courseId, instructorId }) => ({
        url: `/courses/${courseId}/instructors`,
        method: "POST",
        body: { instructorId },
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: "Course", id: courseId },
      ],
    }),

    /** DELETE /api/courses/:courseId/instructors/:instructorId — COURSE_ASSIGN. */
    removeInstructor: build.mutation<
      void,
      { courseId: string; instructorId: string }
    >({
      query: ({ courseId, instructorId }) => ({
        url: `/courses/${courseId}/instructors/${instructorId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: "Course", id: courseId },
      ],
    }),
  }),
});

export const {
  usePublicCoursesQuery,
  usePublicCourseByIdQuery,
  useCourseCatalogQuery,
  useCourseByIdQuery,
  useAssignedCoursesQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useAssignInstructorMutation,
  useRemoveInstructorMutation,
} = coursesApi;
