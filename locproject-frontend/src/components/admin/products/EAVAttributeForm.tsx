'use client';

interface AttributeDefinition {
    key: string;
    label: string;
    dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
    options?: string[];
}

const mockDefinitions: AttributeDefinition[] = [
    { key: 'ingredients', label: 'Thành phần chính', dataType: 'STRING' },
    { key: 'dosage', label: 'Liều dùng', dataType: 'STRING' },
    { key: 'contraindication', label: 'Chống chỉ định', dataType: 'STRING' },
    { key: 'unit_count', label: 'Số viên/hộp', dataType: 'NUMBER' },
    { key: 'is_prescription', label: 'Cần đơn thuốc', dataType: 'BOOLEAN' },
    {
        key: 'form_type',
        label: 'Dạng bào chế',
        dataType: 'SELECT',
        options: ['Dạng cao lỏng', 'Viên nang cứng', 'Trà túi lọc', 'Bột dược liệu'],
    },
];

export default function EAVAttributeForm() {
    return (
        <div className="grid grid-cols-2 gap-6">
            {mockDefinitions.map((def) => (
                <div key={def.key} className="flex flex-col gap-1.5">
                    <label className="font-label-bold text-label-bold text-on-surface-variant">
                        {def.label}
                    </label>
                    {def.dataType === 'STRING' && (
                        <input
                            className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all p-3"
                            placeholder={`Nhập ${def.label.toLowerCase()}...`}
                            type="text"
                        />
                    )}
                    {def.dataType === 'NUMBER' && (
                        <input
                            className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all p-3"
                            placeholder="0"
                            type="number"
                        />
                    )}
                    {def.dataType === 'BOOLEAN' && (
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded border-outline-variant text-primary focus:ring-primary"
                            />
                            <span className="text-body-sm text-on-surface-variant">{def.label}</span>
                        </label>
                    )}
                    {def.dataType === 'SELECT' && (
                        <select className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all p-3">
                            <option value="">Chọn {def.label.toLowerCase()}...</option>
                            {def.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            ))}
        </div>
    );
}