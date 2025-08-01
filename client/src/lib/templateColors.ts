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

// Helper functions with dynamic color assignment
export function getGenreColor(genre: string): TemplateColorConfig {
  const normalizedGenre = genre.toLowerCase().trim();
  if (GENRE_COLORS[normalizedGenre]) {
    return GENRE_COLORS[normalizedGenre];
  }
  
  // Auto-assign colors for new genres
  const newColor = generateColorForNewItem(normalizedGenre, 'genre');
  GENRE_COLORS[normalizedGenre] = newColor;
  
  // Sync to Supabase automatically
  syncColorsToSupabase();
  
  return newColor;
}

export function getCategoryColor(category: string): TemplateColorConfig {
  const normalizedCategory = category.toLowerCase().trim();
  if (CATEGORY_COLORS[normalizedCategory]) {
    return CATEGORY_COLORS[normalizedCategory];
  }
  
  // Auto-assign colors for new categories
  const newColor = generateColorForNewItem(normalizedCategory, 'category');
  CATEGORY_COLORS[normalizedCategory] = newColor;
  
  // Sync to Supabase automatically
  syncColorsToSupabase();
  
  return newColor;
}

// Generate dynamic colors for new items
function generateColorForNewItem(itemName: string, type: 'genre' | 'category'): TemplateColorConfig {
  const colorPalette = [
    { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-200' },
    { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
    { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200' },
    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
    { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
    { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
    { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
    { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-200' },
    { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', border: 'border-fuchsia-200' }
  ];
  
  // Use hash of item name to deterministically assign colors
  const hash = itemName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % colorPalette.length;
  
  return {
    background: colorPalette[colorIndex].bg,
    text: colorPalette[colorIndex].text,
    border: colorPalette[colorIndex].border
  };
}

// Get all unique genres and categories from current color maps
export function getAllGenres(): string[] {
  return Object.keys(GENRE_COLORS);
}

export function getAllCategories(): string[] {
  return Object.keys(CATEGORY_COLORS);
}

// Function to detect and register new genres/categories from templates
export function updateColorsFromTemplates(templates: any[] = [], emailTemplates: any[] = []) {
  let updated = false;
  
  // Check for new genres
  const allGenres = new Set([
    ...templates.map(t => t.genre?.toLowerCase().trim()).filter(Boolean),
    ...emailTemplates.map(t => t.genre?.toLowerCase().trim()).filter(Boolean)
  ]);
  
  allGenres.forEach(genre => {
    if (!GENRE_COLORS[genre]) {
      GENRE_COLORS[genre] = generateColorForNewItem(genre, 'genre');
      updated = true;
    }
  });
  
  // Check for new categories
  const allCategories = new Set([
    ...templates.map(t => t.category?.toLowerCase().trim()).filter(Boolean),
    ...emailTemplates.map(t => t.category?.toLowerCase().trim()).filter(Boolean)
  ]);
  
  allCategories.forEach(category => {
    if (!CATEGORY_COLORS[category]) {
      CATEGORY_COLORS[category] = generateColorForNewItem(category, 'category');
      updated = true;
    }
  });
  
  // Sync to Supabase if any new colors were added
  if (updated) {
    syncColorsToSupabase();
  }
  
  return { updated, newGenres: allGenres.size, newCategories: allCategories.size };
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

// Function to load saved colors from database and update the static color objects
export async function loadColorsFromDatabase() {
  try {
    console.log('[TemplateColors] Loading saved colors from database...');
    
    const response = await fetch('/api/color-settings', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('[TemplateColors] Failed to load colors from database, using defaults');
      return false;
    }

    const colorSettings = await response.json();
    console.log('[TemplateColors] Retrieved color settings:', colorSettings.length);

    // Update the static color objects with database values
    colorSettings.forEach((setting: any) => {
      const colorConfig = {
        background: setting.backgroundColor,
        text: setting.textColor,
        border: setting.borderColor
      };

      if (setting.entityType === 'genre') {
        GENRE_COLORS[setting.entityName] = colorConfig;
        console.log(`[TemplateColors] Updated genre color: ${setting.entityName}`);
      } else if (setting.entityType === 'category') {
        CATEGORY_COLORS[setting.entityName] = colorConfig;
        console.log(`[TemplateColors] Updated category color: ${setting.entityName}`);
      }
    });

    console.log('[TemplateColors] Successfully loaded and applied saved colors');
    return true;
  } catch (error) {
    console.error('[TemplateColors] Error loading colors from database:', error);
    return false;
  }
}

// Centralized color options for consistency across all admin panels
export function getStandardColorOptions() {
  return [
    { value: '#3b82f6', label: 'Blue', class: 'bg-blue-500' },
    { value: '#10b981', label: 'Green', class: 'bg-green-500' },
    { value: '#f59e0b', label: 'Yellow', class: 'bg-yellow-500' },
    { value: '#ef4444', label: 'Red', class: 'bg-red-500' },
    { value: '#8b5cf6', label: 'Purple', class: 'bg-purple-500' },
    { value: '#06b6d4', label: 'Cyan', class: 'bg-cyan-500' },
    { value: '#84cc16', label: 'Lime', class: 'bg-lime-500' },
    { value: '#f97316', label: 'Orange', class: 'bg-orange-500' },
  ];
}

// Auto-load colors on module initialization
if (typeof window !== 'undefined') {
  // Load saved colors first, then sync any missing ones
  loadColorsFromDatabase().then(() => {
    syncColorsToSupabase();
  });
}