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
  // Try multiple ways to get user information
  let currentUserId = userId;
  let userEmail = '';
  let userRole = '';
  
  if (!currentUserId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id;
      userEmail = session?.user?.email || '';
    } catch (error) {
      console.warn('[apiRequest] Failed to get session, using fallback');
    }
  }
  
  // Fallback to stored user data in localStorage
  if (!currentUserId) {
    const storedUser = localStorage.getItem('current_user_id');
    const storedEmail = localStorage.getItem('current_user_email');
    const storedRole = localStorage.getItem('current_user_role');
    if (storedUser) {
      currentUserId = storedUser;
      userEmail = storedEmail || '';
      userRole = storedRole || '';
    }
  }
  
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(currentUserId ? { "x-user-id": currentUserId } : {}),
    ...(userEmail ? { "x-user-email": userEmail } : {}),
    ...(userRole ? { "x-user-role": userRole } : {}),
  };

  console.log('[apiRequest] Making request to:', url, 'with user:', {
    id: currentUserId ? 'present' : 'missing',
    email: userEmail || 'missing',
    role: userRole || 'missing'
  });

  if (method === 'POST' && url.includes('/api/live-reply-template-groups')) {
    console.log('[apiRequest] Template group creation - detailed debug:');
    console.log('[apiRequest] Headers:', headers);
    console.log('[apiRequest] Body data:', data);
    console.log('[apiRequest] Body JSON:', data ? JSON.stringify(data) : 'no body');
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (method === 'POST' && url.includes('/api/live-reply-template-groups')) {
    console.log('[apiRequest] Template group response status:', res.status);
    console.log('[apiRequest] Template group response headers:', Object.fromEntries(res.headers.entries()));
    
    // Clone response to read body without consuming it
    const clonedRes = res.clone();
    try {
      const responseText = await clonedRes.text();
      console.log('[apiRequest] Template group response body:', responseText);
    } catch (e) {
      console.log('[apiRequest] Could not read response body:', e);
    }
  }

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
