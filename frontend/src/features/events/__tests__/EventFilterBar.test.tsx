import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventFilterBar, EMPTY_EVENT_FILTERS } from "../EventFilterBar";

describe("EventFilterBar", () => {
  it("envía todos los filtros en un solo paso al enviar el formulario", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <EventFilterBar values={EMPTY_EVENT_FILTERS} onSubmit={onSubmit} onClear={vi.fn()} />,
    );

    await user.type(screen.getByLabelText("Buscar"), "cerámica");
    await user.selectOptions(screen.getByLabelText("Categoría"), "ART");
    await user.type(screen.getByLabelText("Ubicación"), "Bogotá");
    await user.click(screen.getByRole("button", { name: /buscar/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "cerámica",
        category: "ART",
        location: "Bogotá",
      }),
    );
  });

  it("llama a onClear al presionar Limpiar filtros", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    render(
      <EventFilterBar
        values={{ ...EMPTY_EVENT_FILTERS, search: "algo" }}
        onSubmit={vi.fn()}
        onClear={onClear}
      />,
    );

    await user.click(screen.getByRole("button", { name: /limpiar filtros/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
