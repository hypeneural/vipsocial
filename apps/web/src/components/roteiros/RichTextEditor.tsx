import { useRef, useState, useCallback, useEffect } from "react";
import { Bold, Italic, Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

/**
 * Editor WYSIWYG simples com formatação
 * Suporta: Negrito, Itálico, Marca-texto
 */
export const RichTextEditor = ({
    value,
    onChange,
    onBlur: onBlurProp,
    placeholder = "Digite aqui...",
    className,
    minHeight = "60px",
}: RichTextEditorProps) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const internalValueRef = useRef(value);

    // Sync external value changes into the editor ONLY when not focused
    // This prevents the cursor reset / text reversal issue
    useEffect(() => {
        if (!editorRef.current) return;

        // Skip if the editor is focused (user is actively typing)
        if (isFocused) {
            internalValueRef.current = value;
            return;
        }

        // Only update if the external value differs from what we last emitted
        if (editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
            internalValueRef.current = value;
        }
    }, [value, isFocused]);

    const execCommand = useCallback((command: string, cmdValue?: string) => {
        document.execCommand(command, false, cmdValue);
        editorRef.current?.focus();

        // Atualiza o valor após o comando
        setTimeout(() => {
            if (editorRef.current) {
                const html = editorRef.current.innerHTML;
                internalValueRef.current = html;
                onChange(html);
            }
        }, 0);
    }, [onChange]);

    const handleBold = () => execCommand("bold");
    const handleItalic = () => execCommand("italic");
    const handleHighlight = () => execCommand("backColor", "#FFFF00");

    const handleBlur = () => {
        setIsFocused(false);
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            internalValueRef.current = html;
            onChange(html);
        }
        onBlurProp?.();
    };

    const handleInput = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            internalValueRef.current = html;
            onChange(html);
        }
    };

    return (
        <div className={cn("relative", className)}>
            {/* Toolbar - aparece quando focado */}
            {isFocused && (
                <div
                    className="absolute -top-10 left-0 flex items-center gap-1 p-1 bg-card border border-border rounded-lg shadow-lg z-10"
                    onMouseDown={(e) => e.preventDefault()} // Previne blur ao clicar
                >
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={handleBold}
                        title="Negrito (Ctrl+B)"
                    >
                        <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={handleItalic}
                        title="Itálico (Ctrl+I)"
                    >
                        <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={handleHighlight}
                        title="Marca-texto"
                    >
                        <Highlighter className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Editor */}
            <div
                ref={editorRef}
                className={cn(
                    "w-full px-3 py-2 rounded-lg border transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                    "bg-background text-foreground",
                    isFocused ? "border-primary" : "border-input",
                    "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground"
                )}
                style={{ minHeight }}
                contentEditable
                data-placeholder={placeholder}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                onInput={handleInput}
                onKeyDown={(e) => {
                    // Previne Enter de criar div, usa br
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        document.execCommand("insertLineBreak");
                    }
                }}
            />
        </div>
    );
};
