import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RevealPhoneButton } from "@/features/whatsapp-raffle/components/RevealPhoneButton";

describe("RevealPhoneButton", () => {
    it("requests reveal when hidden", () => {
        const onReveal = vi.fn();

        render(<RevealPhoneButton onReveal={onReveal} />);

        fireEvent.click(screen.getByRole("button", { name: /revelar telefone completo/i }));

        expect(onReveal).toHaveBeenCalledTimes(1);
    });

    it("shows reveal error without hiding the button", () => {
        render(
            <RevealPhoneButton
                errorCode="FORBIDDEN"
                onReveal={vi.fn()}
            />,
        );

        expect(screen.getByRole("alert")).toHaveTextContent("permissao");
        expect(screen.getByRole("button", { name: /revelar telefone completo/i })).toBeEnabled();
    });

    it("shows revealed phone and allows copy", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, { clipboard: { writeText } });

        render(
            <RevealPhoneButton
                onReveal={vi.fn()}
                reveal={{
                    draw_id: "draw-1",
                    confirmation_code: "BR-1234",
                    phone_full: "554791568144",
                    phone_formatted: "+55 47 9156-8144",
                    revealed_at: "2026-06-12T12:00:00Z",
                }}
            />,
        );

        expect(screen.getByText("+55 47 9156-8144")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /copiar telefone/i }));

        expect(writeText).toHaveBeenCalledWith("554791568144");
    });
});
