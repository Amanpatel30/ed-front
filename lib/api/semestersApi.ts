import { baseApi } from "@/lib/api/baseApi";
import type {
  CreateSemesterInput,
  SemesterListParams,
  SemesterResponse,
  SemestersResponse,
  UpdateSemesterInput,
} from "@/lib/types";

export const semestersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /api/semesters — requires SEMESTER_OPEN_CLOSE. */
    semesters: build.query<SemestersResponse, SemesterListParams | void>({
      query: (params) => ({ url: "/semesters", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.semesters.map((semester) => ({
                type: "Semester" as const,
                id: semester.id,
              })),
              { type: "Semester" as const, id: "LIST" },
            ]
          : [{ type: "Semester" as const, id: "LIST" }],
    }),

    /** GET /api/semesters/:id — requires SEMESTER_OPEN_CLOSE. */
    semesterById: build.query<SemesterResponse, string>({
      query: (id) => `/semesters/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Semester", id }],
    }),

    /** POST /api/semesters — requires SEMESTER_OPEN_CLOSE. */
    createSemester: build.mutation<SemesterResponse, CreateSemesterInput>({
      query: (body) => ({ url: "/semesters", method: "POST", body }),
      invalidatesTags: [{ type: "Semester", id: "LIST" }],
    }),

    /**
     * PUT /api/semesters/:id — requires SEMESTER_OPEN_CLOSE.
     * The API does not accept `status` here; opening and closing have their own
     * endpoints because they carry transition rules.
     */
    updateSemester: build.mutation<
      SemesterResponse,
      { id: string; body: UpdateSemesterInput }
    >({
      query: ({ id, body }) => ({
        url: `/semesters/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Semester", id },
        { type: "Semester", id: "LIST" },
      ],
    }),

    /** PATCH /api/semesters/:id/open — requires SEMESTER_OPEN_CLOSE. */
    openSemester: build.mutation<SemesterResponse, string>({
      query: (id) => ({ url: `/semesters/${id}/open`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Semester", id },
        { type: "Semester", id: "LIST" },
      ],
    }),

    /** PATCH /api/semesters/:id/close — requires SEMESTER_OPEN_CLOSE. */
    closeSemester: build.mutation<SemesterResponse, string>({
      query: (id) => ({ url: `/semesters/${id}/close`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Semester", id },
        { type: "Semester", id: "LIST" },
      ],
    }),

    /** DELETE /api/semesters/:id — requires SEMESTER_OPEN_CLOSE. */
    deleteSemester: build.mutation<void, string>({
      query: (id) => ({ url: `/semesters/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Semester", id },
        { type: "Semester", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useSemestersQuery,
  useSemesterByIdQuery,
  useCreateSemesterMutation,
  useUpdateSemesterMutation,
  useOpenSemesterMutation,
  useCloseSemesterMutation,
  useDeleteSemesterMutation,
} = semestersApi;
