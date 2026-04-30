import { api } from "./api";

export interface AdminStats {
    totalUsers: number;
    totalCorrectedPages: number;
    totalSubscribers: number;
}

export interface ChartDataPoint {
    label: string;
    value: number;
}

export interface AdminAdvancedStats {
    revenueData: ChartDataPoint[];
    popularPlansData: ChartDataPoint[];
    subscriptionStatusData: ChartDataPoint[];
    examActivityData: ChartDataPoint[];
}

export interface UserDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    isDisabled: boolean;
    maxAllowedPages: number;
    usedPages: number;
    subscriptionExpiryUtc?: string | null;
    isSubscribed: boolean;
    correctedPagesCount?: number;
}

export interface SubscriptionPlan {
    id: number;
    name: string;
    description?: string;
    price: number;
    maxAllowedPages: number;
    durationValue: number;
    durationUnit: string;
    isActive: boolean;
}

export interface SubscriptionRequest {
    id: number;
    userId: string;
    userFullName: string;
    planId: number;
    planName: string;
    status: string;
    requestedAt: string;
    processedAt?: string;
    adminNotes?: string;
}

export const adminApi = {
    getStats: async (): Promise<AdminStats> => {
        const response = await api.get<AdminStats>("/api/Admin/stats");
        return response.data;
    },

    getAdvancedStats: async (): Promise<AdminAdvancedStats> => {
        const response = await api.get<AdminAdvancedStats>("/api/Admin/advanced-stats");
        return response.data;
    },

    getUsers: async (): Promise<UserDto[]> => {
        const response = await api.get<UserDto[]>("/api/Admin/users");
        return response.data;
    },

    createUser: async (data: Omit<UserDto, "id"> & { password?: string }): Promise<UserDto> => {
        const response = await api.post<UserDto>("/api/Admin/users", data);
        return response.data;
    },

    updateUser: async (id: string, data: Partial<UserDto>): Promise<UserDto> => {
        const response = await api.put<UserDto>(`/api/Admin/users/${id}`, data);
        return response.data;
    },

    deleteUser: async (id: string): Promise<void> => {
        const response = await api.delete(`/api/Admin/users/${id}`);
        return response.data;
    },

    getSettings: async (): Promise<Record<string, string>> => {
        const response = await api.get<Record<string, string>>("/api/Admin/settings");
        return response.data;
    },

    updateSetting: async (key: string, value: string): Promise<void> => {
        const response = await api.post(`/api/Admin/settings/${key}`, `"${value}"`, {
            headers: { "Content-Type": "application/json" }
        });
        return response.data;
    },

    // Subscription Plans
    getPlans: async (): Promise<SubscriptionPlan[]> => {
        const response = await api.get<SubscriptionPlan[]>("/api/Admin/plans");
        return response.data;
    },

    createPlan: async (data: Omit<SubscriptionPlan, "id">): Promise<SubscriptionPlan> => {
        const response = await api.post<SubscriptionPlan>("/api/Admin/plans", data);
        return response.data;
    },

    updatePlan: async (id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
        const response = await api.put<SubscriptionPlan>(`/api/Admin/plans/${id}`, data);
        return response.data;
    },

    deletePlan: async (id: number): Promise<void> => {
        const response = await api.delete(`/api/Admin/plans/${id}`);
        return response.data;
    },

    // Subscription Requests
    getSubscriptionRequests: async (): Promise<SubscriptionRequest[]> => {
        const response = await api.get<SubscriptionRequest[]>("/api/Admin/subscription-requests");
        return response.data;
    },

    processSubscriptionRequest: async (id: number, data: { status: string, adminNotes?: string }): Promise<void> => {
        const response = await api.post(`/api/Admin/subscription-requests/${id}/process`, data);
        return response.data;
    },
};
