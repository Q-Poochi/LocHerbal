import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface CompanySettings {
    id: string;
    companyName: string;
    tagline?: string | null;
    description?: string | null;
    about?: string | null;
    address?: string | null;
    phone?: string | null;
    hotline?: string | null;
    email?: string | null;
    workingHours?: string | null;
    facebookUrl?: string | null;
    youtubeUrl?: string | null;
    zaloUrl?: string | null;
    websiteUrl?: string | null;
    taxCode?: string | null;
    businessLicense?: string | null;
    updatedAt: string;
}

export function usePublicCompanySettings() {
    return useQuery({
        queryKey: ['public-company-settings'],
        queryFn: async () => {
            const { data } = await apiClient.get<CompanySettings>('/settings/company');
            return data;
        },
        staleTime: 60000,
    });
}

export function useCompanySettings() {
    return useQuery({
        queryKey: ['company-settings'],
        queryFn: async () => {
            const { data } = await apiClient.get<CompanySettings>('/settings/company/admin');
            return data;
        },
    });
}

export function useUpdateCompanySettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<Omit<CompanySettings, 'id' | 'updatedAt'>>) => {
            const { data } = await apiClient.patch<CompanySettings>('/settings/company', payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['company-settings'] });
            qc.invalidateQueries({ queryKey: ['public-company-settings'] });
        },
    });
}