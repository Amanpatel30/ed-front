"use client";

import { Lock, LockOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SemesterFormDialog } from "@/components/semesters/semester-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-states";
import { SemesterStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
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
  useCloseSemesterMutation,
  useDeleteSemesterMutation,
  useOpenSemesterMutation,
  useSemestersQuery,
} from "@/lib/api/semestersApi";
import { formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/roles";
import type { Semester } from "@/lib/types";

/**
 * Semester administration. Opening and closing are separate endpoints from the
 * update, so they are separate actions here; nothing changes a status by writing
 * the field directly.
 */
export default function SemestersPage() {
  const semestersQuery = useSemestersQuery();
  const [openSemester, openState] = useOpenSemesterMutation();
  const [closeSemester, closeState] = useCloseSemesterMutation();
  const [deleteSemester, deleteState] = useDeleteSemesterMutation();

  const [status, setStatus] = useState("all");
  const [formSemester, setFormSemester] = useState<Semester | "new" | null>(null);
  const [deleting, setDeleting] = useState<Semester | null>(null);
  const [transitioning, setTransitioning] = useState<string | null>(null);

  const error = normalizeApiError(semestersQuery.error);
  const semesters = semestersQuery.data?.semesters ?? [];
  const visible =
    status === "all"
      ? semesters
      : semesters.filter((semester) => semester.status === status);

  async function transition(semester: Semester, action: "open" | "close") {
    setTransitioning(semester.id);

    try {
      if (action === "open") {
        await openSemester(semester.id).unwrap();
        toast.success(`${semester.name} is open for enrollment`);
      } else {
        await closeSemester(semester.id).unwrap();
        toast.success(`${semester.name} is closed`);
      }
    } catch (mutationError) {
      toast.error(
        normalizeApiError(mutationError)?.message ??
          `Could not ${action} the semester`
      );
    } finally {
      setTransitioning(null);
    }
  }

  async function remove(semester: Semester) {
    try {
      await deleteSemester(semester.id).unwrap();
      toast.success(`${semester.name} deleted`);
      setDeleting(null);
    } catch (mutationError) {
      toast.error(
        normalizeApiError(mutationError)?.message ??
          "Could not delete the semester"
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Semesters"
        description="Terms define when enrollment is allowed. A semester must be open before students can enroll."
        actions={
          <Button onClick={() => setFormSemester("new")}>
            <Plus aria-hidden />
            New semester
          </Button>
        }
      />

      <QueryState
        isLoading={semestersQuery.isLoading}
        error={error}
        isEmpty={semestersQuery.isSuccess && semesters.length === 0}
        emptyTitle="No semesters yet"
        emptyDescription="Create a semester, then open it so students can enroll."
        requiredPermission={PERMISSIONS.semester}
        onRetry={semestersQuery.refetch}
        loadingRows={4}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Select
              items={{
                all: "All statuses",
                UPCOMING: "Upcoming",
                OPEN: "Open",
                CLOSED: "Closed",
              }}
              value={status}
              onValueChange={(next) => setStatus(String(next))}
            >
              <SelectTrigger className="sm:w-44" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="UPCOMING">Upcoming</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground tabular-nums sm:ml-auto">
              {visible.length} of {semesters.length} semesters
            </p>
          </div>

          <Card>
            <CardContent>
              {visible.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No semester matches this filter.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Semester</TableHead>
                      <TableHead>Academic year</TableHead>
                      <TableHead>Runs</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((semester) => (
                      <TableRow key={semester.id}>
                        <TableCell className="font-medium">
                          {semester.name}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {semester.academicYear}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {formatDate(semester.startDate)} —{" "}
                          {formatDate(semester.endDate)}
                        </TableCell>
                        <TableCell>
                          <SemesterStatusBadge status={semester.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {semester.status === "UPCOMING" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={transitioning === semester.id}
                                onClick={() =>
                                  void transition(semester, "open")
                                }
                              >
                                <LockOpen aria-hidden />
                                Open
                              </Button>
                            ) : null}
                            {semester.status === "OPEN" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={transitioning === semester.id}
                                onClick={() =>
                                  void transition(semester, "close")
                                }
                              >
                                <Lock aria-hidden />
                                Close
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Edit ${semester.name}`}
                              onClick={() => setFormSemester(semester)}
                            >
                              <Pencil aria-hidden />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive"
                              aria-label={`Delete ${semester.name}`}
                              onClick={() => setDeleting(semester)}
                            >
                              <Trash2 aria-hidden />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </QueryState>

      {formSemester ? (
        <SemesterFormDialog
          key={formSemester === "new" ? "new" : formSemester.id}
          semester={formSemester === "new" ? undefined : formSemester}
          onClose={() => setFormSemester(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title={`Delete ${deleting?.name ?? ""}?`}
        description="This removes the semester from the record. It is only possible while the API allows it — a semester that still holds enrollments will be refused."
        confirmLabel="Delete semester"
        onConfirm={() => {
          if (deleting) void remove(deleting);
        }}
        pending={deleteState.isLoading || openState.isLoading || closeState.isLoading}
      />
    </div>
  );
}
