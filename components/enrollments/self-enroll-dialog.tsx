"use client";

import { useState } from "react";
import { toast } from "sonner";

import { SelectField, type FieldOption } from "@/components/shared/form-fields";
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
import { useCreateMyEnrollmentMutation } from "@/lib/api/enrollmentsApi";
import type { Course } from "@/lib/types";

/**
 * Self-enrollment for a student. The API decides the outcome — capacity, an
 * existing enrollment in the same course and semester, and the semester status
 * are all enforced there — so the dialog reports whatever it refuses with.
 *
 * The semester choices come from the student's own enrollments: listing
 * semesters needs SEMESTER_OPEN_CLOSE, which a student does not hold.
 */
export function SelfEnrollDialog({
  course,
  semesters,
  onClose,
}: {
  course: Course;
  semesters: FieldOption[];
  onClose: () => void;
}) {
  const [createMyEnrollment, createState] = useCreateMyEnrollmentMutation();
  const [semesterId, setSemesterId] = useState<string | null>(
    semesters.length === 1 ? semesters[0].value : null
  );
  const [error, setError] = useState<string | undefined>();

  const apiError = normalizeApiError(createState.error);

  async function enroll() {
    if (!semesterId) {
      setError("Choose the semester you are enrolling for.");
      return;
    }

    setError(undefined);

    try {
      await createMyEnrollment({ courseId: course.id, semesterId }).unwrap();
      toast.success(`Enrolled in ${course.code}`);
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
        if (!next && !createState.isLoading) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Enroll in {course.code} — {course.name}
          </DialogTitle>
          <DialogDescription>
            {course.credits} credits. The API accepts the enrollment only if the
            semester is open and the course still has a seat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {apiError ? (
            <Alert variant="destructive" role="alert">
              <AlertTitle>Not enrolled</AlertTitle>
              <AlertDescription>{apiError.message}</AlertDescription>
            </Alert>
          ) : null}

          <SelectField
            id="self-enroll-semester"
            label="Semester"
            value={semesterId}
            onValueChange={setSemesterId}
            options={semesters}
            error={error}
            placeholder={
              semesters.length === 0 ? "No open semester available" : "Select a semester"
            }
            hint="Open semesters taken from your own enrollments. Listing every semester needs the SEMESTER_OPEN_CLOSE permission, which a student does not have."
            disabled={semesters.length === 0}
            required
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={createState.isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void enroll()}
            disabled={createState.isLoading || semesters.length === 0}
          >
            {createState.isLoading ? "Enrolling…" : "Enroll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
