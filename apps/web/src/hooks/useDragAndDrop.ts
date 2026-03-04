import { useState, useCallback } from 'react';
import { NewsItem } from '@/types/roteiros';

interface UseDragAndDropResult<T> {
    draggedId: number | null;
    dragOverId: number | null;
    handleDragStart: (id: number) => void;
    handleDragOver: (e: React.DragEvent, id: number) => void;
    handleDragEnd: () => void;
    handleDrop: (targetId: number) => void;
    isDragging: boolean;
    getItemStyle: (id: number) => React.CSSProperties;
}

/**
 * Hook para drag & drop de itens
 * Gerencia o estado de arrasto e a reordenação
 */
export const useDragAndDrop = <T extends { id: number; priority: number }>(
    items: T[],
    onReorder: (items: T[]) => void
): UseDragAndDropResult<T> => {
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dragOverId, setDragOverId] = useState<number | null>(null);

    const handleDragStart = useCallback((id: number) => {
        setDraggedId(id);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, id: number) => {
        e.preventDefault();
        if (draggedId !== id) {
            setDragOverId(id);
        }
    }, [draggedId]);

    const handleDragEnd = useCallback(() => {
        setDraggedId(null);
        setDragOverId(null);
    }, []);

    const handleDrop = useCallback((targetId: number) => {
        if (draggedId === null || draggedId === targetId) {
            handleDragEnd();
            return;
        }

        const draggedIndex = items.findIndex(item => item.id === draggedId);
        const targetIndex = items.findIndex(item => item.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) {
            handleDragEnd();
            return;
        }

        // Cria nova lista reordenada
        const newItems = [...items];
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, removed);

        // Atualiza prioridades baseado na nova ordem
        const updatedItems = newItems.map((item, index) => ({
            ...item,
            priority: index + 1
        }));

        onReorder(updatedItems);
        handleDragEnd();
    }, [draggedId, items, onReorder, handleDragEnd]);

    const getItemStyle = useCallback((id: number): React.CSSProperties => {
        if (draggedId === id) {
            return {
                opacity: 0.5,
                transform: 'scale(1.02)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            };
        }
        if (dragOverId === id) {
            return {
                borderTop: '2px solid hsl(var(--primary))',
                marginTop: '-2px'
            };
        }
        return {};
    }, [draggedId, dragOverId]);

    return {
        draggedId,
        dragOverId,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDrop,
        isDragging: draggedId !== null,
        getItemStyle
    };
};
