import { QueryCache, MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

// Create a client
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error("حدث خطأ في جلب البيانات", {
        description: getErrorMessage(error),
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      // Mutations usually have their own toast, but this is a backup
      // We can also skip it if the mutation already handled it
      toast.error("حدث خطأ في العملية", {
        description: getErrorMessage(error),
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
