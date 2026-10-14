"use client";

import { AlertCircle, Plus, UserMinus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  EmptyState,
  ErrorState,
  LoadingPanel,
  PermissionDeniedState,
} from "@/components/shared/query-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  useAssignInstructorMutation,
  useCourseInstructorsQuery,
  useRemoveInstructorMutation,
} from "@/lib/api/coursesApi";
import { useInstructorsQuery } from "@/lib/api/instructorsApi";
import { normalizeApiError } from "@/lib/api/error";
import { formatDate } from "@/lib/format";
import { useAppSelector } from "@/lib/hooks";
import { can, PERMISSIONS } from "@/lib/roles";
import type { Course, CourseInstructorProfile } from "@/lib/types";

interface CourseInstructorsSectionProps {
  course: Course;
}

export function CourseInstructorsSection({
  course,
}: CourseInstructorsSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canAssign = user?.role ? can.assignInstructors(user.role) : false;

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [removingInstructor, setRemovingInstructor] =
    useState<CourseInstructorProfile | null>(null);

  const {
    data,
    isLoading,
    isError,
    error: rawError,
    refetch,
  } = useCourseInstructorsQuery(course.id);

  const [removeInstructor, { isLoading: isRemoving }] =
    useRemoveInstructorMutation();

  const instructors = data?.instructors ?? [];
  const error = normalizeApiError(rawError);

  async function handleRemoveConfirm() {
    if (!removingInstructor) return;
    try {
      await removeInstructor({
        courseId: course.id,
        instructorId: removingInstructor.id,
      }).unwrap();
      toast.success(
        `${removingInstructor.user?.name ?? removingInstructor.employeeCode} removed from teaching assignments`
      );
      setRemovingInstructor(null);
    } catch (err) {
      toast.error(
        normalizeApiError(err)?.message ?? "Could not remove assignment"
      );
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle>Teaching assignments</CardTitle>
            {!isLoading && !isError && (
              <Badge variant="secondary" className="font-mono text-xs">
                {instructors.length}
              </Badge>
            )}
          </div>
          <CardDescription>
            Faculty assigned to teach this course and manage grades.
          </CardDescription>
        </div>

        {canAssign && (
          <Button
            size="sm"
            onClick={() => setAssignDialogOpen(true)}
            disabled={isLoading || isError}
          >
            <Plus className="size-4 mr-1" aria-hidden />
            Assign instructor
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <LoadingPanel rows={3} />
        ) : isError ? (
          rawError && "status" in rawError && rawError.status === 403 ? (
            <PermissionDeniedState
              permission={PERMISSIONS.courseAssign}
              description="Your role does not have permission to view course teaching assignments."
            />
          ) : (
            <ErrorState
              error={
                error ?? {
                  status: 500,
                  isNetworkError: false,
                  message: "Could not load teaching assignments",
                }
              }
              onRetry={refetch}
            />
          )
        ) : instructors.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No instructors assigned"
            description="No faculty members are currently assigned to this course. Add an assignment to designate instructors."
            action={
              canAssign ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAssignDialogOpen(true)}
                >
                  <Plus className="size-4 mr-1" aria-hidden />
                  Assign instructor
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Employee ID</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Assigned</TableHead>
                  {canAssign && (
                    <TableHead className="w-[80px] text-right">Action</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructors.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {assignment.employeeCode}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {assignment.user?.name ?? "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {assignment.user?.email ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {assignment.designation ?? "Faculty"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {assignment.department?.name ??
                        assignment.department?.code ??
                        "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums">
                      {formatDate(assignment.CourseInstructor?.assignedAt)}
                    </TableCell>
                    {canAssign && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:text-destructive"
                          onClick={() => setRemovingInstructor(assignment)}
                        >
                          <UserMinus className="size-3.5 mr-1" aria-hidden />
                          Remove
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Assign Instructor Dialog */}
      {assignDialogOpen && (
        <AssignInstructorDialog
          course={course}
          currentAssignments={instructors}
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
        />
      )}

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        open={removingInstructor !== null}
        onOpenChange={(open) => {
          if (!open) setRemovingInstructor(null);
        }}
        title={`Remove ${removingInstructor?.user?.name ?? removingInstructor?.employeeCode}?`}
        description={`This will unassign ${removingInstructor?.user?.name ?? "this instructor"} from ${course.code} (${course.name}). They will no longer have access to this course in their teaching roster.`}
        confirmLabel="Remove assignment"
        onConfirm={handleRemoveConfirm}
        pending={isRemoving}
      />
    </Card>
  );
}

interface AssignInstructorDialogProps {
  course: Course;
  currentAssignments: CourseInstructorProfile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AssignInstructorDialog({
  course,
  currentAssignments,
  open,
  onOpenChange,
}: AssignInstructorDialogProps) {
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
  const [assignInstructor, { isLoading: isAssigning }] =
    useAssignInstructorMutation();

  const { data: instructorsData, isLoading: isLoadingInstructors } =
    useInstructorsQuery({ status: "ACTIVE" });

  const assignedIds = new Set(currentAssignments.map((a) => a.id));
  const availableInstructors = (instructorsData?.instructors ?? []).filter(
    (instructor) => !assignedIds.has(instructor.id)
  );

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInstructorId) return;

    try {
      await assignInstructor({
        courseId: course.id,
        instructorId: selectedInstructorId,
      }).unwrap();
      toast.success("Instructor successfully assigned to course");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        normalizeApiError(err)?.message ?? "Failed to assign instructor"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleAssign}>
          <DialogHeader>
            <DialogTitle>Assign instructor</DialogTitle>
            <DialogDescription>
              Assign an active faculty member to teach {course.code} —{" "}
              {course.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {isLoadingInstructors ? (
              <LoadingPanel rows={2} />
            ) : availableInstructors.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                <AlertCircle className="size-4 shrink-0" />
                <span>
                  All active instructors are already assigned to this course, or no
                  active instructors were found.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <label
                  htmlFor="instructor-select"
                  className="text-xs font-medium text-foreground"
                >
                  Select instructor
                </label>
                <Select
                  value={selectedInstructorId}
                  onValueChange={(val) => setSelectedInstructorId(val ?? "")}
                >
                  <SelectTrigger id="instructor-select" className="w-full">
                    <SelectValue placeholder="Choose an instructor to assign..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInstructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.user?.name ?? instructor.employeeCode} (
                        {instructor.employeeCode}
                        {instructor.designation
                          ? ` · ${instructor.designation}`
                          : ""}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !selectedInstructorId ||
                isAssigning ||
                availableInstructors.length === 0
              }
            >
              {isAssigning ? "Assigning..." : "Assign to course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
