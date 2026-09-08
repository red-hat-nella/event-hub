import { useState } from "react";
import type { FormEvent } from "react";
import { Search, X } from "lucide-react";
import { Button } from "../../design-system/atoms/Button";
import { Input } from "../../design-system/atoms/Input";
import { Select } from "../../design-system/atoms/Select";
import { FormField } from "../../design-system/molecules/FormField";
import { EVENT_CATEGORY_LABELS, EVENT_CATEGORY_VALUES } from "../../lib/event-categories";

export interface EventFilterBarValues {
  search: string;
  category: string;
  location: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_EVENT_FILTERS: EventFilterBarValues = {
  search: "",
  category: "",
  location: "",
  dateFrom: "",
  dateTo: "",
};

export interface EventFilterBarProps {
  values: EventFilterBarValues;
  onSubmit: (values: EventFilterBarValues) => void;
  onClear: () => void;
}

/**
 * Barra de filtros de un solo paso (texto + categoría + fecha + ubicación,
 * NFR-008): todos los campos viven en un único formulario que se envía de
 * una vez, sin pasos intermedios.
 */
export function EventFilterBar({ values, onSubmit, onClear }: EventFilterBarProps) {
  const [draft, setDraft] = useState(values);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(draft);
  }

  function handleClear() {
    setDraft(EMPTY_EVENT_FILTERS);
    onClear();
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Filtrar eventos"
      className="grid grid-cols-1 gap-4 rounded-lg border border-border-subtle bg-bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
    >
      <FormField htmlFor="filter-search" label="Buscar">
        <Input
          id="filter-search"
          type="search"
          placeholder="Nombre del evento"
          value={draft.search}
          onChange={(event) => setDraft({ ...draft, search: event.target.value })}
        />
      </FormField>

      <FormField htmlFor="filter-category" label="Categoría">
        <Select
          id="filter-category"
          value={draft.category}
          onChange={(event) => setDraft({ ...draft, category: event.target.value })}
        >
          <option value="">Todas las categorías</option>
          {EVENT_CATEGORY_VALUES.map((value) => (
            <option key={value} value={value}>
              {EVENT_CATEGORY_LABELS[value]}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField htmlFor="filter-location" label="Ubicación">
        <Input
          id="filter-location"
          placeholder="Ciudad o lugar"
          value={draft.location}
          onChange={(event) => setDraft({ ...draft, location: event.target.value })}
        />
      </FormField>

      <FormField htmlFor="filter-date-from" label="Desde">
        <Input
          id="filter-date-from"
          type="date"
          value={draft.dateFrom}
          onChange={(event) => setDraft({ ...draft, dateFrom: event.target.value })}
        />
      </FormField>

      <FormField htmlFor="filter-date-to" label="Hasta">
        <Input
          id="filter-date-to"
          type="date"
          value={draft.dateTo}
          onChange={(event) => setDraft({ ...draft, dateTo: event.target.value })}
        />
      </FormField>

      <div className="flex gap-2 lg:col-span-5">
        <Button type="submit" size="sm" leftIcon={<Search size={16} strokeWidth={1.5} />}>
          Buscar
        </Button>
        <Button type="button" variant="ghost" size="sm" leftIcon={<X size={16} strokeWidth={1.5} />} onClick={handleClear}>
          Limpiar filtros
        </Button>
      </div>
    </form>
  );
}
