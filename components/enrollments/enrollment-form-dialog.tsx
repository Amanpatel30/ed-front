"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  SelectField,
  TextField,
  type FieldOption,
} from "@/components/shared/form-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { normalizeApiError } from "@/lib/api/error";
import {
  useCreateEnrollmentMutation,
  useUpdateEnrollmentMutation,
} from "@/lib/api/enrollmentsApi";
import type { Enrollment } from "@/lib/types";

interface FieldErrors {
  studentId?: string;
  courseId?: string;
  semesterId?: string;
}

/**
 * Administrative enrollment form.
 *
 * The API only accepts an active student, an active course and an open semester,
 * so the caller passes exactly those as options. Editing keeps the student fixed:
 * moving an enrollment to a different student is not a case the API distinguishes
 * from a mistake, and its update endpoint takes the three ids interchangeably.
 *
 * Mounted only while open and keyed by the enrollment, so the fields start from
 * that record without an effect syncing them.
 */
export function EnrollmentFormDialog({
  enrollment,
  onClose,
  students,
  courses,
  semesters,
}: {
  onClose: () => void;
  /** Omitted when creating. */
  enrollment?: Enrollment;
  students: FieldOption[];
  courses: FieldOption[];
  semesters: FieldOption[];
}) {
  const [createEnrollment, createState] = useCreateEnrollmentMutation();
  const [updateEnrollment, updateState] = useUpdateEnrollmentMutation();

  const isEdit = enrollment !== undefined;
  const pending = createState.isLoading || updateState.isLoading;
  const apiError = normalizeApiError(createState.error ?? updateState.error);

  const [studentId, setStudentId] = useState<string | null>(
    enrollment?.studentId ?? null
  );
  const [courseId, setCourseId] = useState<string | null>(
    enrollment?.courseId ?? null
  );
  const [semesterId, setSemesterId] = useState<string | null>(
    enrollment?.semesterId ?? null
  );
  const [enrollmentDate, setEnrollmentDate] = useState(
    enrollment?.enrollmentDate ?? ""
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors: FieldErrors = {};
    if (!isEdit && !studentId) errors.studentId = "Choose the student.";
    if (!courseId) errors.courseId = "Choose the course.";
    if (!semesterId) errors.semesterId = "Choose the semester.";

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0 || !courseId || !semesterId) return;

    try {
      if (isEdit) {
        await updateEnrollment({
          id: enrollment.id,
          body: {
            courseId,
            semesterId,
            ...(enrollmentDate ? { enrollmentDate } : {}),
          },
        }).unwrap();
        toast.success("Enrollment updated");
      } else {
        if (!studentId) return;

        await createEnrollment({
          studentId,
          courseId,
          semesterId,
        }).unwrap();
        toast.success("Enrollment created");
      }

      onClose();
    } catch {
      // Reported through the mutation error state rendered above.
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        // Stay open while the request is in flight so the result is visible.
        if (!next && !pending) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit enrollment" : "New enrollment"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "The API refuses changes to a dropped enrollment and requires the target semester to be open."
              : "The student, course and semester must all be eligible — active student, active course, open semester."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="enrollment-form"
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4"
        >
          {apiError ? (
            <Alert variant="destructive" role="alert">
              <AlertTitle>Could not save the enrollment</AlertTitle>
              <AlertDescription>{apiError.message}</AlertDescription>
            </Alert>
          ) : null}

          {isEdit ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Student: </span>
              {enrollment.student?.user.name ?? enrollment.studentId}
              {enrollment.student ? (
                <span className="text-muted-foreground">
                  {" "}
                  · {enrollment.student.studentCode}
                </span>
              ) : null}
            </p>
          ) : (
            <SelectField
              id="enrollment-student"
              label="Student"
              value={studentId}
              onValueChange={setStudentId}
              options={students}
              error={fieldErrors.studentId}
              placeholder={
                students.length === 0 ? "No active student available" : "Select a student"
              }
              hint="Active students who already hold at least one enrollment. The API exposes no student directory, so a student with no enrollment cannot be chosen yet."
              disabled={students.length === 0}
              required
            />
          )}

          <SelectField
            id="enrollment-course"
            label="Course"
            value={courseId}
            onValueChange={setCourseId}
            options={courses}
            error={fieldErrors.courseId}
            placeholder={courses.length === 0 ? "No active course" : "Select a course"}
            hint="Active courses only — the API rejects an enrollment on an inactive course."
            disabled={courses.length === 0}
            required
          />

          <SelectField
            id="enrollment-semester"
            label="Semester"
            value={semesterId}
            onValueChange={setSemesterId}
            options={semesters}
            error={fieldErrors.semesterId}
            placeholder={
              semesters.length === 0 ? "No open semester" : "Select a semester"
            }
            hint="Open semesters only — the API refuses an enrollment in any other status."
            disabled={semesters.length === 0}
            required
          />

          {isEdit ? (
            <TextField
              id="enrollment-date"
              label="Enrollment date"
              type="date"
              value={enrollmentDate}
              onValueChange={setEnrollmentDate}
              hint="The day the enrollment is recorded against."
            />
          ) : null}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="enrollment-form" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create enrollment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
