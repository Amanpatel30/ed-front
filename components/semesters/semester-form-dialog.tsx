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
  useCreateSemesterMutation,
  useUpdateSemesterMutation,
} from "@/lib/api/semestersApi";
import type { Semester, SemesterStatus } from "@/lib/types";

const STATUS_OPTIONS: FieldOption[] = [
  { value: "UPCOMING", label: "Upcoming — not yet open for enrollment" },
  { value: "OPEN", label: "Open — accepting enrollments" },
  { value: "CLOSED", label: "Closed — enrollment finished" },
];

interface FieldErrors {
  name?: string;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Create and edit share one form. `status` is only sent on create: the API
 * rejects it on update and opens or closes a semester through its own endpoints,
 * because those transitions carry rules of their own.
 *
 * Mounted only while open and keyed by the semester, so the fields start from
 * that record without an effect syncing them.
 */
export function SemesterFormDialog({
  semester,
  onClose,
}: {
  onClose: () => void;
  /** Omitted when creating. */
  semester?: Semester;
}) {
  const [createSemester, createState] = useCreateSemesterMutation();
  const [updateSemester, updateState] = useUpdateSemesterMutation();

  const isEdit = semester !== undefined;
  const pending = createState.isLoading || updateState.isLoading;
  const apiError = normalizeApiError(createState.error ?? updateState.error);

  const [name, setName] = useState(semester?.name ?? "");
  const [academicYear, setAcademicYear] = useState(semester?.academicYear ?? "");
  const [startDate, setStartDate] = useState(semester?.startDate ?? "");
  const [endDate, setEndDate] = useState(semester?.endDate ?? "");
  const [status, setStatus] = useState<SemesterStatus>(
    semester?.status ?? "UPCOMING"
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const todayStr = new Date().toISOString().slice(0, 10);

  function validate(fields: {
    name: string;
    academicYear: string;
    startDate: string;
    endDate: string;
  }): FieldErrors {
    const errors: FieldErrors = {};
    const trimmedName = fields.name.trim();
    const trimmedYear = fields.academicYear.trim();

    if (!trimmedName) errors.name = "Enter the semester name.";
    if (!trimmedYear) errors.academicYear = "Enter the academic year.";
    if (!fields.startDate) {
      errors.startDate = "Choose the first day.";
    } else if (fields.startDate < todayStr) {
      errors.startDate = "Start date cannot be before today.";
    }

    if (!fields.endDate) {
      errors.endDate = "Choose the last day.";
    }

    // The API requires the start to be strictly before the end.
    if (fields.startDate && fields.endDate && fields.endDate <= fields.startDate) {
      errors.endDate = "The last day must be after the first day.";
    }

    return errors;
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validate({ name, academicYear, startDate, endDate });
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const trimmedName = name.trim();
    const trimmedYear = academicYear.trim();

    try {
      if (isEdit) {
        await updateSemester({
          id: semester.id,
          body: {
            name: trimmedName,
            academicYear: trimmedYear,
            startDate,
            endDate,
          },
        }).unwrap();
        toast.success(`${trimmedName} updated`);
      } else {
        await createSemester({
          name: trimmedName,
          academicYear: trimmedYear,
          startDate,
          endDate,
          status,
        }).unwrap();
        toast.success(`${trimmedName} created`);
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
          <DialogTitle>{isEdit ? "Edit semester" : "New semester"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Dates and labels can change at any time. Opening and closing stay on their own actions because they affect enrollment."
              : "Dates are inclusive and must cover a single term."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="semester-form"
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4"
        >
          {apiError ? (
            <Alert variant="destructive" role="alert">
              <AlertTitle>Could not save the semester</AlertTitle>
              <AlertDescription>{apiError.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="semester-name"
              label="Name"
              value={name}
              onValueChange={setName}
              error={fieldErrors.name}
              placeholder="Fall 2026"
              required
            />
            <TextField
              id="semester-year"
              label="Academic year"
              value={academicYear}
              onValueChange={setAcademicYear}
              error={fieldErrors.academicYear}
              placeholder="2026-2027"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="semester-start"
              label="First day"
              type="date"
              value={startDate}
              min={todayStr}
              onValueChange={(val) => {
                setStartDate(val);
                if (fieldErrors.startDate || fieldErrors.endDate) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    if (!val) {
                      next.startDate = "Choose the first day.";
                    } else if (val < todayStr) {
                      next.startDate = "Start date cannot be before today.";
                    } else {
                      delete next.startDate;
                    }
                    if (endDate && val && endDate <= val) {
                      next.endDate = "The last day must be after the first day.";
                    } else if (endDate && val && endDate > val && prev.endDate === "The last day must be after the first day.") {
                      delete next.endDate;
                    }
                    return next;
                  });
                }
              }}
              error={fieldErrors.startDate}
              required
            />
            <TextField
              id="semester-end"
              label="Last day"
              type="date"
              value={endDate}
              min={startDate || todayStr}
              onValueChange={(val) => {
                setEndDate(val);
                if (fieldErrors.endDate) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    if (!val) {
                      next.endDate = "Choose the last day.";
                    } else if (startDate && val <= startDate) {
                      next.endDate = "The last day must be after the first day.";
                    } else {
                      delete next.endDate;
                    }
                    return next;
                  });
                }
              }}
              error={fieldErrors.endDate}
              required
            />
          </div>

          {isEdit ? null : (
            <SelectField
              id="semester-status"
              label="Status"
              value={status}
              onValueChange={(next) => setStatus(next as SemesterStatus)}
              options={STATUS_OPTIONS}
              hint="Open and close from the semester list so the transition is recorded as such."
              required
            />
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="semester-form" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create semester"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
