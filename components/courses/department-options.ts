import type { FieldOption } from "@/components/shared/form-fields";
import type { Course } from "@/lib/types";

/**
 * The API exposes no department collection, so the only departments the app can
 * offer are those already attached to a course. Offering more would mean
 * inventing ids the API cannot resolve.
 */
export function departmentOptionsFromCourses(courses: Course[]): FieldOption[] {
  return [
    ...new Map(
      courses.flatMap((course) =>
        course.department
          ? [
              [
                course.departmentId,
                {
                  value: course.departmentId,
                  label: `${course.department.name} (${course.department.code})`,
                },
              ] as const,
            ]
          : []
      )
    ).values(),
  ].sort((a, b) => a.label.localeCompare(b.label));
}
