import { useEffect, useCallback, useState } from 'react';
import { NewsItem } from '@/types/roteiros';

interface UseShortcutKeysOptions {
    enabled?: boolean;
    onReorder?: (items: NewsItem[]) => void;
}

interface UseShortcutKeysResult {
    highlightedId: number | null;
    clearHighlight: () => void;
}

/**
 * Hook para atalhos de teclado F1-F12
 * Move o item com o atalho correspondente para o topo da lista
 */
export const useShortcutKeys = (
    items: NewsItem[],
    options: UseShortcutKeysOptions = {}
): UseShortcutKeysResult => {
    const { enabled = true, onReorder } = options;
    const [highlightedId, setHighlightedId] = useState<number | null>(null);

    const clearHighlight = useCallback(() => {
        setHighlightedId(null);
    }, []);

    const moveItemToTop = useCallback((targetItem: NewsItem) => {
        if (!onReorder) return;

        // Encontra o índice do item
        const itemIndex = items.findIndex(item => item.id === targetItem.id);
        if (itemIndex === -1 || itemIndex === 0) return; // Já está no topo

        // Cria nova lista com o item no topo
        const newItems = [...items];
        const [removed] = newItems.splice(itemIndex, 1);
        newItems.unshift(removed);

        // Atualiza prioridades
        const updatedItems = newItems.map((item, index) => ({
            ...item,
            priority: index + 1
        }));

        // Aplica highlight por 1.5 segundos
        setHighlightedId(targetItem.id);
        setTimeout(() => setHighlightedId(null), 1500);

        onReorder(updatedItems);
    }, [items, onReorder]);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key?.toUpperCase();

            // Verifica se é tecla F1-F12
            if (key?.startsWith('F') && /^F\d{1,2}$/.test(key)) {
                const fNumber = parseInt(key.slice(1), 10);

                // Limita a F1-F12
                if (fNumber < 1 || fNumber > 12) return;

                // Busca item com o atalho correspondente
                const targetItem = items.find(
                    item => item.shortcut.toUpperCase() === key
                );

                if (targetItem) {
                    event.preventDefault(); // Impede comportamento padrão do browser
                    event.stopPropagation();
                    moveItemToTop(targetItem);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [items, enabled, moveItemToTop]);

    return { highlightedId, clearHighlight };
};
