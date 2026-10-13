import { baseApi } from "@/lib/api/baseApi";
import type {
  DepartmentListParams,
  DepartmentResponse,
  DepartmentsResponse,
} from "@/lib/types";

export const departmentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /api/departments — requires DEPARTMENT_MANAGE. */
    departments: build.query<DepartmentsResponse, DepartmentListParams | void>({
      query: (params) => ({ url: "/departments", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.departments.map((department) => ({
                type: "Department" as const,
                id: department.id,
              })),
              { type: "Department" as const, id: "LIST" },
            ]
          : [{ type: "Department" as const, id: "LIST" }],
    }),

    /** GET /api/departments/:id — requires DEPARTMENT_MANAGE. */
    departmentById: build.query<DepartmentResponse, string>({
      query: (id) => `/departments/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Department", id }],
    }),
  }),
});

export const { useDepartmentsQuery, useDepartmentByIdQuery } = departmentsApi;
