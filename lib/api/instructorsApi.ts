import { baseApi } from "@/lib/api/baseApi";
import type { InstructorListParams, InstructorsResponse } from "@/lib/types";

export const instructorsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /api/instructors — requires INSTRUCTOR_MANAGE. */
    instructors: build.query<InstructorsResponse, InstructorListParams | void>({
      query: (params) => ({
        url: "/instructors",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.instructors.map((instructor) => ({
                type: "Instructor" as const,
                id: instructor.id,
              })),
              { type: "Instructor" as const, id: "LIST" },
            ]
          : [{ type: "Instructor" as const, id: "LIST" }],
    }),
  }),
});

export const { useInstructorsQuery } = instructorsApi;

