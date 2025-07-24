// Template colorization system for genres and categories
// These colors will be synced to Supabase for consistency across users

export interface TemplateColorConfig {
  background: string;
  text: string;
  border: string;
}

// Genre color mappings
export const GENRE_COLORS: Record<string, TemplateColorConfig> = {
  'urgent': {
    background: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  'standard': {
    background: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200'
  },
  'escalation': {
    background: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200'
  },
  'greeting': {
    background: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  'apology': {
    background: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200'
  },
  'thank you': {
    background: 'bg-pink-100',
    text: 'text-pink-800',
    border: 'border-pink-200'
  },
  'follow-up': {
    background: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200'
  },
  'resolution': {
    background: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200'
  },
  'information request': {
    background: 'bg-cyan-100',
    text: 'text-cyan-800',
    border: 'border-cyan-200'
  },
  'complaint handling': {
    background: 'bg-rose-100',
    text: 'text-rose-800',
    border: 'border-rose-200'
  },
  'csat': {
    background: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-200'
  },
  'warning abusive language': {
    background: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  'farewell': {
    background: 'bg-teal-100',
    text: 'text-teal-800',
    border: 'border-teal-200'
  },
  'confirmation': {
    background: 'bg-lime-100',
    text: 'text-lime-800',
    border: 'border-lime-200'
  },
  'technical support': {
    background: 'bg-violet-100',
    text: 'text-violet-800',
    border: 'border-violet-200'
  },
  'holiday/special occasion': {
    background: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  }
};

// Category color mappings
export const CATEGORY_COLORS: Record<string, TemplateColorConfig> = {
  'order issues': {
    background: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-100'
  },
  'delivery problems': {
    background: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-100'
  },
  'payment issues': {
    background: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-100'
  },
  'returns & refunds': {
    background: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-100'
  },
  'product inquiry': {
    background: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-100'
  },
  'general support': {
    background: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-100'
  },
  'technical support': {
    background: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-100'
  },
  'escalation': {
    background: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-100'
  },
  'orders': {
    background: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-100'
  },
  'general': {
    background: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-100'
  },
  'complaint': {
    background: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-100'
  },
  'greetings': {
    background: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-100'
  }
};

// Helper functions
export function getGenreColor(genre: string): TemplateColorConfig {
  const normalizedGenre = genre.toLowerCase().trim();
  return GENRE_COLORS[normalizedGenre] || {
    background: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200'
  };
}

export function getCategoryColor(category: string): TemplateColorConfig {
  const normalizedCategory = category.toLowerCase().trim();
  return CATEGORY_COLORS[normalizedCategory] || {
    background: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200'
  };
}

// Function to get Tailwind color classes for badges
export function getGenreBadgeClasses(genre: string): string {
  const colors = getGenreColor(genre);
  return `${colors.background} ${colors.text} ${colors.border}`;
}

export function getCategoryBadgeClasses(category: string): string {
  const colors = getCategoryColor(category);
  return `${colors.background} ${colors.text} ${colors.border}`;
}

// Function to sync color configuration to Supabase
export async function syncColorsToSupabase() {
  try {
    const colorConfig = {
      genres: GENRE_COLORS,
      categories: CATEGORY_COLORS,
      lastUpdated: new Date().toISOString()
    };

    const response = await fetch('/api/template-colors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(colorConfig),
    });

    if (!response.ok) {
      throw new Error('Failed to sync colors to Supabase');
    }

    console.log('[TemplateColors] Successfully synced to Supabase');
    return true;
  } catch (error) {
    console.error('[TemplateColors] Failed to sync to Supabase:', error);
    return false;
  }
}

// Auto-sync colors on module load (runs once)
if (typeof window !== 'undefined') {
  syncColorsToSupabase();
}