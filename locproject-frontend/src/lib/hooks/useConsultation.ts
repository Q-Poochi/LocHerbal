import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface SlotHour {
    hour: number;
    label: string;
}

export interface SlotsResponse {
    date?: string;
    preferredHours: SlotHour[];
}

export interface ConsultationLead {
    id: string;
    fullName: string;
    phone: string;
    email?: string;
    note?: string;
    preferredDate?: string;
    preferredTime?: string;
    confirmedAt?: string;
    status: string;
    assignedTo?: string;
    assignee?: { id: string; fullName: string; email: string } | null;
    customer?: { id: string; fullName: string; phone: string } | null;
    createdAt: string;
}

export interface ConsultationListResponse {
    data: ConsultationLead[];
    total: number;
    page: number;
    limit: number;
}

export interface BookConsultationPayload {
    fullName: string;
    phone: string;
    email?: string;
    note?: string;
    preferredDate: string;
    preferredTime: string;
}

// ── Storefront ───────────────────────────────────────────────────────────
export function useConsultationSlots(date?: string) {
    return useQuery({
        queryKey: ['consultation-slots', date ?? 'today'],
        queryFn: async () => {
            const params = date ? { date } : {};
            const { data } = await apiClient.get<SlotsResponse>('/consultations/slots', { params });
            return data;
        },
        enabled: true,
    });
}

export function useBookConsultation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: BookConsultationPayload) => {
            const { data } = await apiClient.post('/consultations', payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['consultation-slots'] });
        },
    });
}

// ── Admin ────────────────────────────────────────────────────────────────
export function useAdminConsultations(params: { status?: string; page?: number; limit?: number } = {}) {
    return useQuery({
        queryKey: ['admin-consultations', params.status ?? 'ALL', params.page ?? 1],
        queryFn: async () => {
            const { data } = await apiClient.get<ConsultationListResponse>('/consultations', { params });
            return data;
        },
    });
}

export function useUpdateLeadStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { data } = await apiClient.patch(`/consultations/${id}/status`, { status });
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-consultations'] });
        },
    });
}