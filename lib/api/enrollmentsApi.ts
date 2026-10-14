import { baseApi } from "@/lib/api/baseApi";
import type {
  CreateEnrollmentInput,
  EnrollmentListParams,
  EnrollmentMutationResponse,
  EnrollmentResponse,
  EnrollmentsResponse,
  SelfEnrollmentInput,
  UpdateEnrollmentInput,
} from "@/lib/types";

/**
 * Administrative lists and the student's own list are tagged separately
 * ("ALL" vs "MINE") so a mutation in one place never triggers a refetch of the
 * other.
 */
export const enrollmentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* ------------------------------------------------ admin / super admin */

    /** GET /api/enrollments — requires ENROLLMENT_VIEW_ALL. */
    enrollments: build.query<EnrollmentsResponse, EnrollmentListParams | void>({
      query: (params) => ({ url: "/enrollments", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.enrollments.map((enrollment) => ({
                type: "Enrollment" as const,
                id: `ALL-${enrollment.id}`,
              })),
              { type: "Enrollment" as const, id: "ALL" },
            ]
          : [{ type: "Enrollment" as const, id: "ALL" }],
    }),

    /** GET /api/enrollments/:id — requires ENROLLMENT_VIEW_ALL. */
    enrollmentById: build.query<EnrollmentResponse, string>({
      query: (id) => `/enrollments/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "Enrollment", id: `ALL-${id}` },
      ],
    }),

    /** POST /api/enrollments — requires ENROLLMENT_CREATE_UPDATE_DROP. */
    createEnrollment: build.mutation<
      EnrollmentMutationResponse,
      CreateEnrollmentInput
    >({
      query: (body) => ({ url: "/enrollments", method: "POST", body }),
      invalidatesTags: [{ type: "Enrollment", id: "ALL" }],
    }),

    /** PUT /api/enrollments/:id — requires ENROLLMENT_CREATE_UPDATE_DROP. */
    updateEnrollment: build.mutation<
      EnrollmentMutationResponse,
      { id: string; body: UpdateEnrollmentInput }
    >({
      query: ({ id, body }) => ({
        url: `/enrollments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Enrollment", id: `ALL-${id}` },
        { type: "Enrollment", id: "ALL" },
      ],
    }),

    /** PATCH /api/enrollments/:id/drop — ENROLLMENT_CREATE_UPDATE_DROP. */
    dropEnrollment: build.mutation<EnrollmentMutationResponse, string>({
      query: (id) => ({ url: `/enrollments/${id}/drop`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Enrollment", id: `ALL-${id}` },
        { type: "Enrollment", id: "ALL" },
      ],
    }),

    /* ------------------------------------------------------- student self-service */

    /** GET /api/enrollments/me — requires OWN_ENROLLMENT_VIEW. */
    myEnrollments: build.query<EnrollmentsResponse, EnrollmentListParams | void>({
      query: (params) => ({ url: "/enrollments/me", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.enrollments.map((enrollment) => ({
                type: "Enrollment" as const,
                id: `MINE-${enrollment.id}`,
              })),
              { type: "Enrollment" as const, id: "MINE" },
            ]
          : [{ type: "Enrollment" as const, id: "MINE" }],
    }),

    /** GET /api/enrollments/me/:id — requires OWN_ENROLLMENT_VIEW. */
    myEnrollmentById: build.query<EnrollmentResponse, string>({
      query: (id) => `/enrollments/me/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "Enrollment", id: `MINE-${id}` },
      ],
    }),

    /** POST /api/enrollments/me — requires OWN_ENROLLMENT_CREATE_DROP. */
    createMyEnrollment: build.mutation<
      EnrollmentMutationResponse,
      SelfEnrollmentInput
    >({
      query: (body) => ({ url: "/enrollments/me", method: "POST", body }),
      invalidatesTags: [
        { type: "Enrollment", id: "MINE" },
        { type: "Course", id: "LIST" },
      ],
    }),

    /** PATCH /api/enrollments/me/:id/drop — OWN_ENROLLMENT_CREATE_DROP. */
    dropMyEnrollment: build.mutation<EnrollmentMutationResponse, string>({
      query: (id) => ({ url: `/enrollments/me/${id}/drop`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Enrollment", id: `MINE-${id}` },
        { type: "Enrollment", id: "MINE" },
        { type: "Course", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useEnrollmentsQuery,
  useEnrollmentByIdQuery,
  useCreateEnrollmentMutation,
  useUpdateEnrollmentMutation,
  useDropEnrollmentMutation,
  useMyEnrollmentsQuery,
  useMyEnrollmentByIdQuery,
  useCreateMyEnrollmentMutation,
  useDropMyEnrollmentMutation,
} = enrollmentsApi;
