"use client";

import { BookOpen, UserMinus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-states";
import { StatCard } from "@/components/shared/stat-card";
import { EnrollmentStatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { normalizeApiError } from "@/lib/api/error";
import {
  useDropMyEnrollmentMutation,
  useMyEnrollmentsQuery,
} from "@/lib/api/enrollmentsApi";
import { formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/roles";
import type { Enrollment } from "@/lib/types";

/**
 * A student's own enrollments. The API drops only inside an open semester, so the
 * action is offered only where it can succeed; the backend still enforces it.
 */
export default function MyEnrollmentsPage() {
  const enrollmentsQuery = useMyEnrollmentsQuery();
  const [dropMyEnrollment, dropState] = useDropMyEnrollmentMutation();

  const [status, setStatus] = useState("all");
  const [dropping, setDropping] = useState<Enrollment | null>(null);

  const error = normalizeApiError(enrollmentsQuery.error);
  const enrollments = enrollmentsQuery.data?.enrollments ?? [];

  const visible =
    status === "all"
      ? enrollments
      : enrollments.filter((enrollment) => enrollment.status === status);

  const active = enrollments.filter(
    (enrollment) => enrollment.status === "ACTIVE"
  );

  const activeCredits = active.reduce(
    (total, enrollment) => total + enrollment.course.credits,
    0
  );

  async function drop(enrollment: Enrollment) {
    try {
      await dropMyEnrollment(enrollment.id).unwrap();
      toast.success(`${enrollment.course.code} dropped`);
      setDropping(null);
    } catch (mutationError) {
      toast.error(
        normalizeApiError(mutationError)?.message ?? "Could not drop the course"
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My enrollments"
        description="Every course you have taken, including dropped ones. Re-enrolling in a course you dropped for the same semester is not possible."
        actions={
          <Link
            href="/catalog"
            className={buttonVariants()}
          >
            <BookOpen aria-hidden />
            Browse catalog
          </Link>
        }
      />

      <QueryState
        isLoading={enrollmentsQuery.isLoading}
        error={error}
        isEmpty={enrollmentsQuery.isSuccess && enrollments.length === 0}
        emptyTitle="You are not enrolled in anything"
        emptyDescription="Browse the catalog to join a course. Enrollment needs an open semester and an available seat."
        requiredPermission={PERMISSIONS.ownEnrollment}
        emptyAction={
          <Link
            href="/catalog"
            className={buttonVariants()}
          >
            <BookOpen aria-hidden />
            Browse catalog
          </Link>
        }
        onRetry={enrollmentsQuery.refetch}
        loadingRows={6}
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Active courses" value={active.length} />
            <StatCard label="Credits enrolled" value={activeCredits} />
            <StatCard label="Enrollment records" value={enrollments.length} />
          </div>

          <div className="flex items-center gap-3">
            <Select
              items={{
                all: "All enrollments",
                ACTIVE: "Active",
                DROPPED: "Dropped",
              }}
              value={status}
              onValueChange={(next) => setStatus(String(next))}
            >
              <SelectTrigger className="sm:w-48" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All enrollments</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DROPPED">Dropped</SelectItem>
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground tabular-nums sm:ml-auto">
              {visible.length} of {enrollments.length} records
            </p>
          </div>

          <Card>
            <CardContent>
              {visible.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No enrollment matches this filter.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {visible.map((enrollment) => {
                      const droppable =
                        enrollment.status === "ACTIVE" &&
                        enrollment.semester.status === "OPEN";

                      return (
                        <TableRow key={enrollment.id}>
                          <TableCell>
                            <span className="font-mono text-xs">
                              {enrollment.course.code}
                            </span>
                            <span className="font-medium">
                              {" "}
                              {enrollment.course.name}
                            </span>
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {enrollment.course.department?.code ?? "—"}
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {enrollment.semester.name}
                          </TableCell>

                          <TableCell className="text-right tabular-nums">
                            {enrollment.course.credits}
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
                            <div className="flex justify-end">
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
        </div>
      </QueryState>

      <ConfirmDialog
        open={dropping !== null}
        onOpenChange={(next) => {
          if (!next) setDropping(null);
        }}
        title={`Drop ${dropping?.course.code ?? ""}?`}
        description="The record is kept and marked dropped. The seat is not guaranteed to be free again, and re-enrolling in the same course for the same semester is refused afterwards."
        confirmLabel="Drop course"
        onConfirm={() => {
          if (dropping) void drop(dropping);
        }}
        pending={dropState.isLoading}
      />
    </div>
  );
}