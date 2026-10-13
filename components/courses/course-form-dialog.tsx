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
import {
  useCreateCourseMutation,
  useUpdateCourseMutation,
} from "@/lib/api/coursesApi";
import { normalizeApiError } from "@/lib/api/error";
import type { Course } from "@/lib/types";

interface FieldErrors {
  code?: string;
  name?: string;
  credits?: string;
  capacity?: string;
  departmentId?: string;
}

function parseWholeNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed === "" || !/^\d+$/.test(trimmed)) return null;

  return Number.parseInt(trimmed, 10);
}

/**
 * Create and edit share one form because the API takes the same fields for both.
 *
 * The dialog is mounted only while it is open and keyed by the course, so the
 * fields start from that course without an effect syncing them.
 */
export function CourseFormDialog({
  course,
  onClose,
  departments,
}: {
  onClose: () => void;
  /** Omitted when creating. */
  course?: Course;
  departments: FieldOption[];
}) {
  const [createCourse, createState] = useCreateCourseMutation();
  const [updateCourse, updateState] = useUpdateCourseMutation();

  const isEdit = course !== undefined;
  const pending = createState.isLoading || updateState.isLoading;
  const apiError = normalizeApiError(createState.error ?? updateState.error);

  const [code, setCode] = useState(course?.code ?? "");
  const [name, setName] = useState(course?.name ?? "");
  const [credits, setCredits] = useState(course ? String(course.credits) : "");
  const [capacity, setCapacity] = useState(
    course ? String(course.capacity) : ""
  );
  const [departmentId, setDepartmentId] = useState<string | null>(
    course?.departmentId ?? null
  );
  const [isActive, setIsActive] = useState(
    course ? String(course.isActive) : "true"
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors: FieldErrors = {};
    const trimmedCode = code.trim();
    const trimmedName = name.trim();
    const parsedCredits = parseWholeNumber(credits);
    const parsedCapacity = capacity.trim() === "" ? null : parseWholeNumber(capacity);

    if (!trimmedCode) errors.code = "Enter the course code.";
    if (!trimmedName) errors.name = "Enter the course name.";

    if (parsedCredits === null || parsedCredits < 1) {
      errors.credits = "Enter the credit weight as a whole number of 1 or more.";
    }

    if (capacity.trim() !== "" && (parsedCapacity === null || parsedCapacity < 0)) {
      errors.capacity = "Enter the capacity as a whole number, or leave it empty.";
    }

    if (!departmentId) errors.departmentId = "Choose the department.";

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0 || parsedCredits === null || !departmentId) {
      return;
    }

    try {
      if (isEdit) {
        await updateCourse({
          id: course.id,
          body: {
            departmentId,
            code: trimmedCode,
            name: trimmedName,
            credits: parsedCredits,
            ...(parsedCapacity === null ? {} : { capacity: parsedCapacity }),
            isActive: isActive === "true",
          },
        }).unwrap();
        toast.success(`${trimmedCode} updated`);
      } else {
        await createCourse({
          departmentId,
          code: trimmedCode,
          name: trimmedName,
          credits: parsedCredits,
          ...(parsedCapacity === null ? {} : { capacity: parsedCapacity }),
        }).unwrap();
        toast.success(`${trimmedCode} created`);
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
          <DialogTitle>{isEdit ? "Edit course" : "New course"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Changes apply to the catalogue immediately. Deactivating a course keeps its enrollment history."
              : "The course is added to the catalogue for the selected department."}
          </DialogDescription>
        </DialogHeader>

        <form id="course-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {apiError ? (
            <Alert variant="destructive" role="alert">
              <AlertTitle>Could not save the course</AlertTitle>
              <AlertDescription>{apiError.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="course-code"
              label="Course code"
              value={code}
              onValueChange={setCode}
              error={fieldErrors.code}
              placeholder="CSE101"
              required
            />
            <TextField
              id="course-credits"
              label="Credits"
              value={credits}
              onValueChange={setCredits}
              error={fieldErrors.credits}
              inputMode="numeric"
              placeholder="4"
              required
            />
          </div>

          <TextField
            id="course-name"
            label="Course name"
            value={name}
            onValueChange={setName}
            error={fieldErrors.name}
            placeholder="Introduction to Programming"
            required
          />

          <SelectField
            id="course-department"
            label="Department"
            value={departmentId}
            onValueChange={setDepartmentId}
            options={departments}
            error={fieldErrors.departmentId}
            placeholder={
              departments.length === 0
                ? "No active department exists"
                : "Select a department"
            }
            hint="Active departments. A course cannot be created before its department exists."
            disabled={departments.length === 0}
            required
          />

          <TextField
            id="course-capacity"
            label="Capacity"
            value={capacity}
            onValueChange={setCapacity}
            error={fieldErrors.capacity}
            hint="Seats available. Leave empty to let the API apply its default."
            inputMode="numeric"
            placeholder="60"
          />

          {isEdit ? (
            <SelectField
              id="course-active"
              label="Catalogue status"
              value={isActive}
              onValueChange={setIsActive}
              options={[
                { value: "true", label: "Active — listed and enrollable" },
                { value: "false", label: "Inactive — retired from the catalogue" },
              ]}
              hint="Deactivating drops the course from the catalogue list and keeps its enrollment history. The API returns no inactive courses, so the only way back to this course is its detail page."
            />
          ) : null}
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" form="course-form" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
