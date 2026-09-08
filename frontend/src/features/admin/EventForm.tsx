import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { ApiError } from "../../services/api-client";
import type { CreateEventDto } from "../../services/api-client";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_CATEGORY_VALUES,
  eventFormSchema,
  toStartsAtIso,
} from "./event-form.schema";
import type { EventFormValues } from "./event-form.schema";
import { FormField, fieldA11yProps } from "../../design-system/molecules/FormField";
import { Input } from "../../design-system/atoms/Input";
import { Select } from "../../design-system/atoms/Select";
import { Textarea } from "../../design-system/atoms/Textarea";
import { Button } from "../../design-system/atoms/Button";

export interface EventFormInitialValues {
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  maxCapacity: number;
  category: EventFormValues["category"];
  imageUrl: string;
}

export const EMPTY_EVENT_FORM_VALUES: EventFormInitialValues = {
  name: "",
  description: "",
  date: "",
  time: "",
  location: "",
  maxCapacity: 1,
  category: "",
  imageUrl: "",
};

export interface EventFormProps {
  defaultValues?: EventFormInitialValues;
  onSubmit: (dto: CreateEventDto) => Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
}

/**
 * Organismo compartido crear/editar (`ux-design.md §11-12`, T104). El
 * submit traduce `date`+`time` a `startsAt` ISO-8601 y limpia campos
 * opcionales vacíos antes de llamar a `onSubmit`; los errores 400/409 que
 * `onSubmit` propague (`ApiError`) se traducen aquí a errores por campo o
 * banner — mismo patrón que `AuthForm`. `409 CAPACITY_BELOW_ACTIVE_REGISTRATIONS`
 * (BR-011, editar evento) se asocia al campo `maxCapacity`.
 */
export function EventForm({ defaultValues, onSubmit, submitLabel, onCancel }: EventFormProps) {
  const [serverError, setServerError] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: defaultValues ?? EMPTY_EVENT_FORM_VALUES,
  });

  async function submit(values: EventFormValues) {
    setServerError(undefined);
    const dto: CreateEventDto = {
      name: values.name,
      description: values.description,
      startsAt: toStartsAtIso(values.date, values.time),
      location: values.location,
      maxCapacity: values.maxCapacity,
      category: values.category ? values.category : undefined,
      imageUrl: values.imageUrl ? values.imageUrl : undefined,
    };

    try {
      await onSubmit(dto);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "VALIDATION_ERROR" && Object.keys(error.fields).length > 0) {
          Object.entries(error.fields).forEach(([field, message]) => {
            setError(field as keyof EventFormValues, { message });
          });
          return;
        }
        if (error.code === "CAPACITY_BELOW_ACTIVE_REGISTRATIONS") {
          setError("maxCapacity", { message: error.message });
          return;
        }
        setServerError(error.message);
        return;
      }
      setServerError("Ocurrió un error inesperado. Intenta de nuevo.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      {serverError && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-sm border border-error/30 bg-error/5 px-3 py-2 text-sm text-error"
        >
          <AlertCircle size={16} strokeWidth={1.5} aria-hidden="true" />
          {serverError}
        </p>
      )}

      <FormField htmlFor="name" label="Nombre del evento" error={errors.name?.message} required>
        <Input {...fieldA11yProps("name", errors.name?.message)} {...register("name")} />
      </FormField>

      <FormField htmlFor="description" label="Descripción" error={errors.description?.message} required>
        <Textarea
          {...fieldA11yProps("description", errors.description?.message)}
          {...register("description")}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField htmlFor="date" label="Fecha" error={errors.date?.message} required>
          <Input type="date" {...fieldA11yProps("date", errors.date?.message)} {...register("date")} />
        </FormField>

        <FormField htmlFor="time" label="Hora" error={errors.time?.message} required>
          <Input type="time" {...fieldA11yProps("time", errors.time?.message)} {...register("time")} />
        </FormField>
      </div>

      <FormField htmlFor="location" label="Ubicación" error={errors.location?.message} required>
        <Input {...fieldA11yProps("location", errors.location?.message)} {...register("location")} />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          htmlFor="maxCapacity"
          label="Capacidad máxima"
          error={errors.maxCapacity?.message}
          required
        >
          <Input
            type="number"
            min={1}
            step={1}
            {...fieldA11yProps("maxCapacity", errors.maxCapacity?.message)}
            {...register("maxCapacity", { valueAsNumber: true })}
          />
        </FormField>

        <FormField htmlFor="category" label="Categoría" error={errors.category?.message}>
          <Select {...fieldA11yProps("category", errors.category?.message)} {...register("category")}>
            <option value="">Sin categoría</option>
            {EVENT_CATEGORY_VALUES.map((value) => (
              <option key={value} value={value}>
                {EVENT_CATEGORY_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField
        htmlFor="imageUrl"
        label="URL de imagen"
        hint="Opcional"
        error={errors.imageUrl?.message}
      >
        <Input
          type="url"
          placeholder="https://..."
          {...fieldA11yProps("imageUrl", errors.imageUrl?.message)}
          {...register("imageUrl")}
        />
      </FormField>

      <div className="mt-2 flex gap-3">
        <Button type="submit" size="md" loading={isSubmitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="md" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
