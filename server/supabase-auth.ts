import { createClient } from '@supabase/supabase-js';
import type { User } from '@shared/schema';

export class SupabaseAuth {
  private client;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }
    
    this.client = createClient(supabaseUrl, supabaseKey);
    console.log('[SupabaseAuth] Service role client initialized');
  }

  async verifyUser(email: string): Promise<User | null> {
    try {
      // Check if user exists in our users table
      const { data: userData, error } = await this.client
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('[SupabaseAuth] Error fetching user:', error);
        return null;
      }

      if (userData) {
        return {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          profileImageUrl: userData.profile_image_url,
          role: userData.role,
          status: userData.status,
          isOnline: userData.is_online,
          lastSeen: userData.last_seen ? new Date(userData.last_seen) : null,
          createdAt: userData.created_at ? new Date(userData.created_at) : null,
          updatedAt: userData.updated_at ? new Date(userData.updated_at) : null,
        };
      }

      return null;
    } catch (error) {
      console.error('[SupabaseAuth] Error verifying user:', error);
      return null;
    }
  }

  async createUser(userData: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: 'admin' | 'agent';
  }): Promise<User | null> {
    try {
      const { data, error } = await this.client
        .from('users')
        .insert({
          id: userData.id,
          email: userData.email,
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          role: userData.role || 'agent',
          status: 'active',
          is_online: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[SupabaseAuth] Error creating user:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        profileImageUrl: data.profile_image_url,
        role: data.role,
        status: data.status,
        isOnline: data.is_online,
        lastSeen: data.last_seen ? new Date(data.last_seen) : null,
        createdAt: data.created_at ? new Date(data.created_at) : null,
        updatedAt: data.updated_at ? new Date(data.updated_at) : null,
      };
    } catch (error) {
      console.error('[SupabaseAuth] Error creating user:', error);
      return null;
    }
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean, metadata?: any): Promise<void> {
    try {
      console.log(`[SupabaseAuth] Enhanced presence update for ${userId}: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      
      const updateData: any = {
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Log special cases for debugging
      if (metadata?.pageHidden && !isOnline) {
        console.log(`[SupabaseAuth] Page tab hidden: ${userId} -> OFFLINE`);
      }
      if (metadata?.pageVisible && isOnline) {
        console.log(`[SupabaseAuth] Page tab visible: ${userId} -> ONLINE`);
      }
      if (metadata?.pageUnload) {
        console.log(`[SupabaseAuth] Page unload detected: ${userId} -> OFFLINE`);
      }

      await this.client
        .from('users')
        .update(updateData)
        .eq('id', userId);
        
      console.log(`[SupabaseAuth] ✅ Successfully updated presence: ${userId} = ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    } catch (error) {
      console.error('[SupabaseAuth] Error updating user online status:', error);
    }
  }

  // Enhanced heartbeat processing with metadata support
  async processHeartbeat(userId: string, data: {
    isOnline: boolean;
    lastActivity?: string;
    timestamp?: string;
    pageHidden?: boolean;
    pageVisible?: boolean;
    pageUnload?: boolean;
    heartbeatStopped?: boolean;
  }): Promise<void> {
    try {
      console.log(`[SupabaseAuth] Processing enhanced heartbeat for ${userId}:`, {
        online: data.isOnline,
        special: data.pageHidden ? 'hidden' : data.pageVisible ? 'visible' : data.pageUnload ? 'unloading' : 'normal'
      });
      
      await this.updateUserOnlineStatus(userId, data.isOnline, {
        pageHidden: data.pageHidden,
        pageVisible: data.pageVisible,
        pageUnload: data.pageUnload,
        heartbeatStopped: data.heartbeatStopped
      });
    } catch (error) {
      console.error('[SupabaseAuth] Error processing heartbeat:', error);
      throw error;
    }
  }
}

export const supabaseAuth = new SupabaseAuth();