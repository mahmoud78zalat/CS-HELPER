/**
 * Fallback Supabase client for deployment environments without credentials
 * Provides mock authentication for development and deployment testing
 */

// Mock Supabase client interface
const mockSupabaseClient = {
  auth: {
    signInWithPassword: async () => ({
      data: { user: null, session: null },
      error: { message: 'Supabase not configured - using mock authentication' }
    }),
    signOut: async () => ({
      error: null
    }),
    getUser: async () => ({
      data: { user: null },
      error: { message: 'Supabase not configured' }
    }),
    onAuthStateChange: (callback: any) => {
      // Return a mock subscription
      return {
        data: { subscription: { unsubscribe: () => {} } }
      };
    }
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({
          data: null,
          error: { message: 'Supabase not configured' }
        })
      })
    }),
    insert: () => ({
      select: async () => ({
        data: null,
        error: { message: 'Supabase not configured' }
      })
    }),
    update: () => ({
      eq: () => ({
        select: async () => ({
          data: null,
          error: { message: 'Supabase not configured' }
        })
      })
    }),
    delete: () => ({
      eq: async () => ({
        data: null,
        error: null
      })
    })
  })
};

export { mockSupabaseClient as supabase };

// Mock auth helper functions
export const signInWithEmail = async (email: string, password: string) => {
  return {
    data: { user: null, session: null },
    error: { message: 'Supabase not configured - using fallback authentication' }
  };
};

export const signOut = async () => {
  return { error: null };
};

export const getCurrentUser = async () => {
  return {
    user: null,
    error: { message: 'Supabase not configured' }
  };
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return {
    data: { subscription: { unsubscribe: () => {} } }
  };
};