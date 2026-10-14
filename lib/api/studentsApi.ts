import { baseApi } from "@/lib/api/baseApi";
import type {
  StudentListParams,
  StudentResponse,
  StudentsResponse,
} from "@/lib/types";

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /api/students — requires STUDENT_MANAGE. */
    students: build.query<StudentsResponse, StudentListParams | void>({
      query: (params) => ({ url: "/students", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.students.map((student) => ({
                type: "Student" as const,
                id: student.id,
              })),
              { type: "Student" as const, id: "LIST" },
            ]
          : [{ type: "Student" as const, id: "LIST" }],
    }),

    /** GET /api/students/:id — requires STUDENT_MANAGE. */
    studentById: build.query<StudentResponse, string>({
      query: (id) => `/students/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Student", id }],
    }),
  }),
});

export const { useStudentsQuery, useStudentByIdQuery } = studentsApi;

