"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { CourseFormDialog } from "@/components/courses/course-form-dialog";
import type { FieldOption } from "@/components/shared/form-fields";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState, UnavailableState } from "@/components/shared/query-states";
import { CourseActiveBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCourseByIdQuery } from "@/lib/api/coursesApi";
import { useDepartmentsQuery } from "@/lib/api/departmentsApi";
import { normalizeApiError } from "@/lib/api/error";
import { formatDate, formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/roles";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const courseQuery = useCourseByIdQuery(id);
  const departmentsQuery = useDepartmentsQuery({ isActive: true });
  const [editing, setEditing] = useState(false);

  const course = courseQuery.data?.course;
  const error = normalizeApiError(courseQuery.error);

  const departments: FieldOption[] = (
    departmentsQuery.data?.departments ?? []
  ).map((department) => ({
    value: department.id,
    label: `${department.name} (${department.code})`,
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/courses"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft aria-hidden />
        All courses
      </Link>

      <QueryState
        isLoading={courseQuery.isLoading}
        error={error}
        requiredPermission={PERMISSIONS.catalog}
        notFound={{
          title: "This course is not in the catalogue",
          endpoint: "GET /api/courses/:id",
          description:
            "The API has no course with this id. It may have been removed since this link was created.",
        }}
        onRetry={courseQuery.refetch}
      >
        {course ? (
          <>
            <PageHeader
              title={`${course.code} — ${course.name}`}
              description={`${course.credits} credits · capacity ${course.capacity}`}
              actions={
                <Button onClick={() => setEditing(true)}>
                  <Pencil aria-hidden />
                  Edit course
                </Button>
              }
            />

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Course record</CardTitle>
                <CardDescription>
                  Values as stored by the API for this course.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Detail label="Code" value={course.code} mono />
                  <Detail label="Name" value={course.name} />

                  <Detail
                    label="Department"
                    value={
                      course.department
                        ? `${course.department.name} (${course.department.code})`
                        : course.departmentId
                    }
                  />

                  <Detail label="Credits" value={String(course.credits)} />
                  <Detail label="Capacity" value={String(course.capacity)} />

                  <Detail
                    label="Catalogue status"
                    value={<CourseActiveBadge isActive={course.isActive} />}
                  />

                  <Detail
                    label="Created"
                    value={formatDate(course.createdAt)}
                  />

                  <Detail
                    label="Last updated"
                    value={formatDateTime(course.updatedAt)}
                  />
                </dl>
              </CardContent>
            </Card>

            <div className="mt-6">
              <UnavailableState
                title="This course's teaching assignments cannot be read"
                endpoint="GET /api/courses/:id/instructors"
                description="The instructor directory exists and the API can assign an instructor to this course, but no endpoint returns a course's own assignments. Without that list an assignment could only be added or removed blind, so the section stays empty."
              />
            </div>
          </>
        ) : null}
      </QueryState>

      {editing && course ? (
        <CourseFormDialog
          key={course.id}
          course={course}
          onClose={() => setEditing(false)}
          departments={departments}
        />
      ) : null}
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-sm" : "text-sm"}>{value}</dd>
    </div>
  );
}