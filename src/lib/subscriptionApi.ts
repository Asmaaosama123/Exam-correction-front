import { api } from "./api";
import type { SubscriptionPlan, SubscriptionRequest } from "./adminApi";

export const subscriptionApi = {
    getPlans: async (): Promise<SubscriptionPlan[]> => {
        const response = await api.get<SubscriptionPlan[]>("/api/Subscription/plans");
        return response.data;
    },

    requestSubscription: async (planId: number): Promise<SubscriptionRequest> => {
        const response = await api.post<SubscriptionRequest>(`/api/Subscription/request/${planId}`);
        return response.data;
    },

    getMyRequests: async (): Promise<SubscriptionRequest[]> => {
        const response = await api.get<SubscriptionRequest[]>("/api/Subscription/my-requests");
        return response.data;
    },

    initiatePayment: async (planId: number): Promise<{ paymentUrl: string }> => {
        const response = await api.post<{ paymentUrl: string }>(`/api/Subscription/initiate-payment/${planId}`);
        return response.data;
    }
};
