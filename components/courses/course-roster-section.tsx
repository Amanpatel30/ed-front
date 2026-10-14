"use client";

import {
  AlertCircle,
  Download,
  GraduationCap,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EmptyState,
  ErrorState,
  LoadingPanel,
  PermissionDeniedState,
} from "@/components/shared/query-states";
import { EnrollmentStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
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
  useCourseRosterQuery,
  useRecordGradeMutation,
} from "@/lib/api/coursesApi";
import { normalizeApiError } from "@/lib/api/error";
import { formatDate } from "@/lib/format";
import { useAppSelector } from "@/lib/hooks";
import { can, PERMISSIONS } from "@/lib/roles";
import {
  VALID_GRADES,
  type CourseRosterEnrollment,
  type ValidGrade,
} from "@/lib/types";

interface CourseRosterSectionProps {
  courseId: string;
  courseCode?: string;
  courseName?: string;
}

export function CourseRosterSection({
  courseId,
  courseCode,
  courseName,
}: CourseRosterSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canRecordGrade = user?.role ? can.recordGrades(user.role) : false;
  const [search, setSearch] = useState("");

  const {
    data,
    isLoading,
    isError,
    error: rawError,
    refetch,
  } = useCourseRosterQuery(courseId, {
    skip: !courseId,
  });

  const enrollments = useMemo(
    () => data?.enrollments ?? [],
    [data?.enrollments]
  );
  const error = normalizeApiError(rawError);

  const activeCount = useMemo(
    () => enrollments.filter((e) => e.status === "ACTIVE").length,
    [enrollments]
  );
  const gradedCount = useMemo(
    () => enrollments.filter((e) => Boolean(e.grade)).length,
    [enrollments]
  );

  const filteredEnrollments = useMemo(() => {
    if (!search.trim()) return enrollments;
    const q = search.trim().toLowerCase();
    return enrollments.filter((e) => {
      const code = e.student?.studentCode?.toLowerCase() ?? "";
      const name = e.student?.user?.name?.toLowerCase() ?? "";
      const email = e.student?.user?.email?.toLowerCase() ?? "";
      return code.includes(q) || name.includes(q) || email.includes(q);
    });
  }, [enrollments, search]);

  function handleExportCsv() {
    if (enrollments.length === 0) return;
    const headers = [
      "Student Code",
      "Student Name",
      "Email",
      "Department",
      "Semester",
      "Status",
      "Grade",
      "Enrolled Date",
    ];
    const rows = enrollments.map((e) => [
      `"${e.student?.studentCode ?? ""}"`,
      `"${(e.student?.user?.name ?? "").replace(/"/g, '""')}"`,
      `"${(e.student?.user?.email ?? "").replace(/"/g, '""')}"`,
      `"${(e.student?.department?.code ?? e.student?.department?.name ?? "").replace(/"/g, '""')}"`,
      `"${(e.semester?.name ?? "").replace(/"/g, '""')}"`,
      `"${e.status}"`,
      `"${e.grade ?? ""}"`,
      `"${formatDate(e.enrollmentDate)}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\r\n"
    );
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `roster-${courseCode || courseId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" aria-hidden />
            <CardTitle>Course roster & grades</CardTitle>
            {!isLoading && !isError && (
              <div className="flex items-center gap-1.5 ml-1">
                <Badge variant="secondary" className="font-mono text-xs">
                  {enrollments.length} enrolled
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {activeCount} active
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {gradedCount} graded
                </Badge>
              </div>
            )}
          </div>
          <CardDescription>
            {courseCode ? (
              <span>
                Students enrolled in <strong className="text-foreground">{courseCode}</strong>
                {courseName ? ` — ${courseName}` : ""}. View enrollment status and manage grades.
              </span>
            ) : (
              "Students enrolled in this course. View enrollment status and manage grades."
            )}
          </CardDescription>
        </div>

        {!isLoading && !isError && enrollments.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-56">
              <Search
                className="absolute left-2.5 top-2 size-3.5 text-muted-foreground"
                aria-hidden
              />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-8 text-xs"
            >
              <Download className="size-3.5 mr-1" aria-hidden />
              Export
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <LoadingPanel rows={4} />
        ) : isError ? (
          rawError && "status" in rawError && rawError.status === 403 ? (
            <PermissionDeniedState
              permission={PERMISSIONS.roster}
              description="You do not have permission to view this course roster. Only instructors assigned to teach this course and authorized administrators have access."
            />
          ) : rawError && "status" in rawError && rawError.status === 404 ? (
            <EmptyState
              icon={AlertCircle}
              title="Course not found"
              description="The requested course could not be found or has been removed."
            />
          ) : (
            <ErrorState
              error={
                error ?? {
                  status: 500,
                  isNetworkError: false,
                  message: "Could not load course roster",
                }
              }
              onRetry={refetch}
            />
          )
        ) : enrollments.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students enrolled"
            description="No students are currently enrolled in this course. Enrolled students will appear here with grade management options."
          />
        ) : filteredEnrollments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No students match &ldquo;{search}&rdquo;
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setSearch("")}
              className="mt-1 text-xs"
            >
              Clear search filter
            </Button>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Student ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[120px]">Enrolled</TableHead>
                  <TableHead className="w-[150px]">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {enrollment.student?.studentCode ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground text-sm">
                          {enrollment.student?.user?.name ?? "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {enrollment.student?.user?.email ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {enrollment.student?.department?.code ??
                        enrollment.student?.department?.name ??
                        "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <div>{enrollment.semester?.name ?? "—"}</div>
                      {enrollment.semester?.academicYear && (
                        <div className="text-[11px] text-muted-foreground/75">
                          {enrollment.semester.academicYear}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <EnrollmentStatusBadge status={enrollment.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums">
                      {formatDate(enrollment.enrollmentDate)}
                    </TableCell>
                    <TableCell>
                      <GradeCell
                        courseId={courseId}
                        enrollment={enrollment}
                        canRecordGrade={canRecordGrade}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GradeCellProps {
  courseId: string;
  enrollment: CourseRosterEnrollment;
  canRecordGrade: boolean;
}

function GradeCell({ courseId, enrollment, canRecordGrade }: GradeCellProps) {
  const [recordGrade, { isLoading }] = useRecordGradeMutation();
  const isDropped = enrollment.status === "DROPPED";

  // Dropped enrollments cannot receive grades per business rules and backend validation
  if (isDropped) {
    return (
      <div className="flex flex-col gap-0.5">
        {enrollment.grade ? (
          <Badge variant="secondary" className="font-mono text-xs w-fit">
            {enrollment.grade}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            No grade
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">
          Dropped (cannot grade)
        </span>
      </div>
    );
  }

  // If user cannot record grades, show read-only view
  if (!canRecordGrade) {
    return enrollment.grade ? (
      <Badge variant="outline" className="font-mono font-semibold text-xs">
        {enrollment.grade}
      </Badge>
    ) : (
      <span className="text-xs text-muted-foreground italic">Not graded</span>
    );
  }

  const currentValue = enrollment.grade ?? "NONE";

  async function handleGradeChange(value: string | null) {
    if (!value || value === currentValue) return;

    const targetGrade = value === "NONE" ? null : (value as ValidGrade);

    try {
      await recordGrade({
        courseId,
        enrollmentId: enrollment.id,
        grade: targetGrade,
      }).unwrap();

      const studentName =
        enrollment.student?.user?.name ??
        enrollment.student?.studentCode ??
        "Student";

      toast.success(
        targetGrade
          ? `Grade ${targetGrade} recorded for ${studentName}`
          : `Grade cleared for ${studentName}`
      );
    } catch (err) {
      toast.error(
        normalizeApiError(err)?.message ?? "Failed to update grade"
      );
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={currentValue}
        onValueChange={handleGradeChange}
        disabled={isLoading}
      >
        <SelectTrigger
          size="sm"
          className="h-7 w-24 font-mono text-xs"
          aria-label={`Grade for ${enrollment.student?.user?.name ?? enrollment.student?.studentCode}`}
        >
          {isLoading ? (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Saving...
            </span>
          ) : (
            <SelectValue placeholder="Set grade" />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NONE">
            <span className="text-muted-foreground italic text-xs">
              — No grade
            </span>
          </SelectItem>
          <SelectSeparator />
          {VALID_GRADES.map((grade) => (
            <SelectItem key={grade} value={grade} className="font-mono text-xs">
              {grade}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {enrollment.grade && !isLoading && (
        <Badge
          variant="outline"
          className="font-mono text-[10px] px-1 py-0 h-4 bg-muted/50"
        >
          {enrollment.grade}
        </Badge>
      )}
    </div>
  );
}
