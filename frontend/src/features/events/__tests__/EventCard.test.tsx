import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { EventCard } from "../../../design-system/organisms/EventCard";
import type { EventSummary } from "../../../services/api-client";

const baseEvent: EventSummary = {
  id: "evt-1",
  name: "Taller de cerámica",
  startsAt: "2099-01-01T18:00:00.000Z",
  location: "Taller Central",
  category: "ART",
  imageUrl: null,
  maxCapacity: 30,
  availableSlots: 12,
  temporalStatus: "UPCOMING",
};

function renderCard(event: EventSummary) {
  return render(
    <MemoryRouter>
      <EventCard event={event} />
    </MemoryRouter>,
  );
}

describe("EventCard", () => {
  it("muestra el nombre, categoría, ubicación y disponibilidad", () => {
    renderCard(baseEvent);

    expect(screen.getByRole("heading", { name: "Taller de cerámica" })).toBeInTheDocument();
    expect(screen.getByText("Arte")).toBeInTheDocument();
    expect(screen.getByText("Taller Central")).toBeInTheDocument();
    expect(screen.getByText("12 de 30 cupos")).toBeInTheDocument();
  });

  it("muestra el CTA Ver detalle enlazado al detalle del evento", () => {
    renderCard(baseEvent);

    const link = screen.getByRole("link", { name: /ver detalle/i });
    expect(link).toHaveAttribute("href", "/eventos/evt-1");
  });

  it("muestra el badge Agotado (texto + ícono) cuando no hay cupos", () => {
    renderCard({ ...baseEvent, availableSlots: 0 });

    expect(screen.getByText("Agotado")).toBeInTheDocument();
    expect(screen.queryByText("0 de 30 cupos")).not.toBeInTheDocument();
  });

  it("renderiza una ilustración de reemplazo cuando no hay imagen", () => {
    renderCard(baseEvent);

    expect(screen.getByRole("img", { name: /ilustración de categoría/i })).toBeInTheDocument();
  });
});
