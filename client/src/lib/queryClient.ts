import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  userId?: string,
): Promise<Response> {
  // Try multiple ways to get user ID
  let currentUserId = userId;
  
  if (!currentUserId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
    } catch (error) {
      console.warn('[apiRequest] Failed to get session, using fallback');
    }
  }
  
  // Fallback to stored user ID in localStorage
  if (!currentUserId) {
    const storedUser = localStorage.getItem('current_user_id');
    if (storedUser) {
      currentUserId = storedUser;
    }
  }
  
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(currentUserId ? { "x-user-id": currentUserId } : {}),
  };

  console.log('[apiRequest] Making request to:', url, 'with user ID:', currentUserId ? 'present' : 'missing');

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get current user ID for authentication
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    const headers: Record<string, string> = {
      ...(userId ? { "x-user-id": userId } : {}),
    };

    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
