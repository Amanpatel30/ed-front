"use client";

import { Pencil, Plus, Search, UserMinus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EnrollmentFormDialog } from "@/components/enrollments/enrollment-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { FieldOption } from "@/components/shared/form-fields";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/pagination";
import { QueryState } from "@/components/shared/query-states";
import { EnrollmentStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCourseCatalogQuery } from "@/lib/api/coursesApi";
import { normalizeApiError } from "@/lib/api/error";
import {
  useDropEnrollmentMutation,
  useEnrollmentsQuery,
} from "@/lib/api/enrollmentsApi";
import { useSemestersQuery } from "@/lib/api/semestersApi";
import { formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/roles";
import type { Enrollment } from "@/lib/types";

const PAGE_SIZE = 15;

/**
 * Every enrollment in the institution, for ADMIN and SUPER_ADMIN.
 *
 * The student picker is built from the enrollments already on screen because the
 * API has no student directory. See the form dialog for the limit that implies.
 *
 * shortcut: search and the two filters narrow the loaded rows because the API
 * accepts no filter parameters.
 */
export default function EnrollmentsPage() {
  const enrollmentsQuery = useEnrollmentsQuery();
  const coursesQuery = useCourseCatalogQuery();
  const semestersQuery = useSemestersQuery();
  const [dropEnrollment, dropState] = useDropEnrollmentMutation();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [semesterId, setSemesterId] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Enrollment | "new" | null>(null);
  const [dropping, setDropping] = useState<Enrollment | null>(null);

  const error =
    normalizeApiError(enrollmentsQuery.error) ??
    normalizeApiError(coursesQuery.error) ??
    normalizeApiError(semestersQuery.error);
  const isLoading =
    enrollmentsQuery.isLoading || coursesQuery.isLoading || semestersQuery.isLoading;

  const enrollments = enrollmentsQuery.data?.enrollments ?? [];
  const semesters = semestersQuery.data?.semesters ?? [];
  const courses = coursesQuery.data?.courses ?? [];

  const courseOptions: FieldOption[] = courses.map((course) => ({
    value: course.id,
    label: `${course.code} — ${course.name}`,
  }));

  const semesterOptions: FieldOption[] = semesters.map((semester) => ({
    value: semester.id,
    label: `${semester.name} · ${semester.academicYear}`,
  }));

  // Only an open semester can receive an enrollment: the API refuses any other.
  const openSemesterOptions = semesterOptions.filter((option) =>
    semesters.some(
      (semester) => semester.id === option.value && semester.status === "OPEN"
    )
  );

  const studentOptions: FieldOption[] = [
    ...new Map(
      enrollments.flatMap((enrollment) =>
        enrollment.student && enrollment.student.status === "ACTIVE"
          ? [
              [
                enrollment.studentId,
                {
                  value: enrollment.studentId,
                  label: `${enrollment.student.user.name} · ${enrollment.student.studentCode}`,
                },
              ] as const,
            ]
          : []
      )
    ).values(),
  ].sort((a, b) => a.label.localeCompare(b.label));

  const term = search.trim().toLowerCase();
  const filtered = enrollments.filter((enrollment) => {
    if (status !== "all" && enrollment.status !== status) return false;
    if (semesterId !== "all" && enrollment.semesterId !== semesterId) return false;
    if (!term) return true;

    const student = enrollment.student?.user.name ?? "";
    const studentCode = enrollment.student?.studentCode ?? "";

    return (
      student.toLowerCase().includes(term) ||
      studentCode.toLowerCase().includes(term) ||
      enrollment.course.code.toLowerCase().includes(term) ||
      enrollment.course.name.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const filtersActive =
    term !== "" || status !== "ACTIVE" || semesterId !== "all";

  async function drop(enrollment: Enrollment) {
    try {
      await dropEnrollment(enrollment.id).unwrap();
      toast.success(
        `${enrollment.course.code} dropped for ${
          enrollment.student?.user.name ?? "the student"
        }`
      );
      setDropping(null);
    } catch (mutationError) {
      toast.error(
        normalizeApiError(mutationError)?.message ?? "Could not drop the enrollment"
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollments"
        description="Who is enrolled in what, and for which semester. Dropping keeps the record and marks it dropped."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden />
            New enrollment
          </Button>
        }
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={enrollmentsQuery.isSuccess && enrollments.length === 0}
        emptyTitle="No enrollments yet"
        emptyDescription="Enrollments appear here once a student takes a course for a semester."
        requiredPermission={PERMISSIONS.enrollment}
        onRetry={enrollmentsQuery.refetch}
        loadingRows={8}
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative lg:max-w-xs lg:flex-1">
              <Search
                className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search student or course"
                aria-label="Search enrollments"
                className="pl-8"
              />
            </div>

            <Select
              items={{ ACTIVE: "Active", DROPPED: "Dropped", all: "All statuses" }}
              value={status}
              onValueChange={(next) => {
                setStatus(String(next));
                setPage(1);
              }}
            >
              <SelectTrigger className="lg:w-40" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DROPPED">Dropped</SelectItem>
                <SelectItem value="all">All statuses</SelectItem>
              </SelectContent>
            </Select>

            <Select
              items={Object.fromEntries(
                semesterOptions.map((option) => [option.value, option.label])
              )}
              value={semesterId}
              onValueChange={(next) => {
                setSemesterId(String(next));
                setPage(1);
              }}
            >
              <SelectTrigger className="lg:w-56" aria-label="Filter by semester">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                {semesterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filtersActive ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatus("ACTIVE");
                  setSemesterId("all");
                  setPage(1);
                }}
              >
                <X aria-hidden />
                Clear
              </Button>
            ) : null}

            <p className="text-xs text-muted-foreground tabular-nums lg:ml-auto">
              {filtered.length} of {enrollments.length} enrollments
            </p>
          </div>

          <Card>
            <CardContent>
              {visible.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No enrollment matches these filters.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((enrollment) => {
                      // The API drops only inside an open semester.
                      const droppable =
                        enrollment.status === "ACTIVE" &&
                        enrollment.semester.status === "OPEN";

                      return (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">
                            {enrollment.student?.user.name ??
                              enrollment.studentId}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs">
                              {enrollment.course.code}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              {enrollment.course.name}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {enrollment.semester.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {formatDate(enrollment.enrollmentDate)}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {enrollment.grade ?? "—"}
                          </TableCell>
                          <TableCell>
                            <EnrollmentStatusBadge status={enrollment.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Edit enrollment"
                                onClick={() => setEditing(enrollment)}
                              >
                                <Pencil aria-hidden />
                              </Button>
                              {droppable ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => setDropping(enrollment)}
                                >
                                  <UserMinus aria-hidden />
                                  Drop
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {totalPages > 1 ? (
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              total={filtered.length}
              unit="enrollment"
              onPageChange={setPage}
            />
          ) : null}
        </div>
      </QueryState>

      {editing ? (
        <EnrollmentFormDialog
          key={editing === "new" ? "new" : editing.id}
          enrollment={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          students={studentOptions}
          courses={courseOptions}
          semesters={openSemesterOptions}
        />
      ) : null}

      <ConfirmDialog
        open={dropping !== null}
        onOpenChange={(next) => {
          if (!next) setDropping(null);
        }}
        title={`Drop ${dropping?.course.code ?? ""}?`}
        description="The enrollment is kept and marked dropped. Re-enrolling the same student in the same course and semester afterwards is refused."
        confirmLabel="Drop enrollment"
        onConfirm={() => {
          if (dropping) void drop(dropping);
        }}
        pending={dropState.isLoading}
      />
    </div>
  );
}
