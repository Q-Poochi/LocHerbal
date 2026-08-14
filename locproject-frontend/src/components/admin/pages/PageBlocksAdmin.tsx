'use client';

import { useState } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    useAdminPageBlocks,
    useCreatePageBlock,
    useUpdatePageBlock,
    useReorderPageBlocks,
    useDeletePageBlock,
    PAGE_BLOCK_TYPE_LABELS,
    type AdminPageBlock,
    type PageBlockType,
} from '@/lib/hooks/useMarketing';
import { useToast } from '@/lib/providers/toast-provider';
import { getErrorMessage } from '@/lib/utils/error';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import BlockForm from './BlockForm';
import AddBlockModal from './AddBlockModal';

const TYPE_ICONS: Record<PageBlockType, string> = {
    hero: 'image',
    text: 'notes',
    'image-text': 'view_sidebar',
    stats: 'monitoring',
    team: 'group',
    timeline: 'timeline',
};

const TYPE_BADGE_COLORS: Record<PageBlockType, string> = {
    hero: 'bg-primary/10 text-primary',
    text: 'bg-info/10 text-info',
    'image-text': 'bg-warning/10 text-warning',
    stats: 'bg-success/10 text-success',
    team: 'bg-secondary-container/40 text-secondary',
    timeline: 'bg-outline-variant/30 text-on-surface-variant',
};

interface SortableBlockProps {
    block: AdminPageBlock;
    onEdit: (b: AdminPageBlock) => void;
    onTogglePublish: (b: AdminPageBlock) => void;
    onDelete: (id: string) => void;
    toggling: boolean;
}

function SortableBlock({ block, onEdit, onTogglePublish, onDelete, toggling }: SortableBlockProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const summary = summarize(block);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isDragging ? 'border-primary shadow-lg' : 'border-border'}`}
        >
            <div className="flex items-center gap-3 p-3 border-b border-border">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="p-1.5 text-on-surface-variant/50 hover:text-on-surface-variant cursor-grab active:cursor-grabbing touch-none"
                    title="Kéo để sắp xếp"
                >
                    <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
                </button>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold ${TYPE_BADGE_COLORS[block.type]}`}>
                    <span className="material-symbols-outlined text-[14px]">{TYPE_ICONS[block.type]}</span>
                    {PAGE_BLOCK_TYPE_LABELS[block.type]}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">#{block.order + 1}</span>
                <div className="ml-auto flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onTogglePublish(block)}
                        disabled={toggling}
                        className={`relative w-10 h-5.5 rounded-full transition-colors ${
                            block.isPublished ? 'bg-success' : 'bg-outline-variant'
                        } disabled:opacity-50`}
                        title={block.isPublished ? 'Đang hiển thị — nhấn để ẩn' : 'Đang ẩn — nhấn để hiển thị'}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                                block.isPublished ? 'translate-x-5' : ''
                            }`}
                        />
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(block)}
                        className="p-1.5 text-text-tertiary hover:text-primary hover:bg-surface-alt transition-all rounded-lg inline-flex"
                        title="Sửa nội dung"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(block.id)}
                        className="p-1.5 text-text-tertiary hover:text-error hover:bg-error-container/10 transition-all rounded-lg inline-flex"
                        title="Xoá khối"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            </div>
            <div className="p-4 text-sm text-on-surface-variant">{summary}</div>
        </div>
    );
}

function summarize(block: AdminPageBlock): string {
    const c = block.content as Record<string, unknown>;
    switch (block.type) {
        case 'hero':
            return (c.title as string) || '(chưa có tiêu đề)';
        case 'text':
            return (c.heading as string) || (c.body as string) || '(trống)';
        case 'image-text':
            return (c.heading as string) || '(trống)';
        case 'stats':
            return `${Array.isArray(c.items) ? (c.items as unknown[]).length : 0} số liệu`;
        case 'team':
            return `${Array.isArray(c.members) ? (c.members as unknown[]).length : 0} thành viên`;
        case 'timeline':
            return `${Array.isArray(c.milestones) ? (c.milestones as unknown[]).length : 0} mốc`;
        default:
            return '(trống)';
    }
}

interface PageBlocksAdminProps {
    pageSlug: string;
    pageTitle: string;
}

export default function PageBlocksAdmin({ pageSlug, pageTitle }: PageBlocksAdminProps) {
    const { data: blocks = [], isLoading, error } = useAdminPageBlocks(pageSlug);
    const createMutation = useCreatePageBlock(pageSlug);
    const updateMutation = useUpdatePageBlock(pageSlug);
    const reorderMutation = useReorderPageBlocks(pageSlug);
    const deleteMutation = useDeletePageBlock(pageSlug);
    const toast = useToast();

    const [editing, setEditing] = useState<AdminPageBlock | null>(null);
    const [adding, setAdding] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const onDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = blocks.findIndex((b) => b.id === active.id);
        const newIndex = blocks.findIndex((b) => b.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({ ...b, order: i }));
        try {
            await reorderMutation.mutateAsync(reordered.map((b) => ({ id: b.id, order: b.order })));
        } catch (e) {
            toast.error(getErrorMessage(e, 'Không thể cập nhật thứ tự'));
        }
    };

    const togglePublish = async (block: AdminPageBlock) => {
        try {
            await updateMutation.mutateAsync({
                id: block.id,
                payload: { isPublished: !block.isPublished },
            });
        } catch (e) {
            toast.error(getErrorMessage(e, 'Không thể đổi trạng thái'));
        }
    };

    const saveContent = async (content: Record<string, unknown>) => {
        if (!editing) return;
        try {
            await updateMutation.mutateAsync({ id: editing.id, payload: { content } });
            toast.success('Đã lưu nội dung');
            setEditing(null);
        } catch (e) {
            toast.error(getErrorMessage(e, 'Không thể lưu nội dung'));
        }
    };

    const createBlock = async (type: PageBlockType) => {
        try {
            await createMutation.mutateAsync({ type });
            toast.success('Đã thêm khối mới');
            setAdding(false);
        } catch (e) {
            toast.error(getErrorMessage(e, 'Không thể thêm khối'));
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget);
            toast.success('Đã xoá khối');
        } catch (e) {
            toast.error(getErrorMessage(e, 'Không thể xoá khối'));
        } finally {
            setDeleteTarget(null);
        }
    };

    return (
        <>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-caption text-on-surface-variant mb-2">
                        <span>Nội dung</span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-primary font-semibold">Trang tĩnh</span>
                    </nav>
                    <h2 className="font-headline-lg text-headline-lg text-primary">{pageTitle}</h2>
                    <p className="text-sm text-on-surface-variant mt-1">Kéo thả để sắp xếp thứ tự. Thay đổi được lưu tự động.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="bg-primary-container text-white px-6 py-3 rounded-xl font-label-bold flex items-center gap-2 shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined">add_box</span>
                    Thêm khối
                </button>
            </div>

            {isLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-border p-16 text-center">
                    <span className="text-text-tertiary">Đang tải khối nội dung...</span>
                </div>
            ) : error ? (
                <div className="bg-white rounded-xl shadow-sm border border-border p-16 text-center">
                    <p className="text-text-secondary font-medium">{getErrorMessage(error, 'Không thể tải danh sách khối')}</p>
                </div>
            ) : blocks.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-border p-16 text-center">
                    <span className="material-symbols-outlined text-[56px] text-text-tertiary mb-4">web</span>
                    <p className="text-text-secondary font-medium">Trang chưa có khối nội dung nào.</p>
                    <p className="text-sm text-text-tertiary mt-1">Nhấn "Thêm khối" để bắt đầu xây dựng trang.</p>
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {blocks.map((block) => (
                                <SortableBlock
                                    key={block.id}
                                    block={block}
                                    onEdit={setEditing}
                                    onTogglePublish={togglePublish}
                                    onDelete={setDeleteTarget}
                                    toggling={updateMutation.isPending}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {editing && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-label-bold text-label-bold text-primary">
                                    Sửa: {PAGE_BLOCK_TYPE_LABELS[editing.type]}
                                </h3>
                                <p className="text-xs text-on-surface-variant mt-0.5">Thay đổi hiển thị ngay trên trang.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded-lg"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <BlockForm
                            block={editing}
                            onSubmit={saveContent}
                            onCancel={() => setEditing(null)}
                            submitting={updateMutation.isPending}
                        />
                    </div>
                </div>
            )}

            <AddBlockModal
                open={adding}
                submitting={createMutation.isPending}
                onSelect={createBlock}
                onClose={() => setAdding(false)}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Xoá khối"
                message="Khối này sẽ bị xoá vĩnh viễn và biến mất khỏi trang. Bạn chắc chắn muốn tiếp tục?"
                isPending={deleteMutation.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </>
    );
}