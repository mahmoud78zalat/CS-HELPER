// Test announcement creation directly through our storage interface
import { SupabaseStorage } from './server/supabase-storage.js';

// Simulate environment variables from .env
const storage = new SupabaseStorage();

async function testAnnouncementCreation() {
  try {
    console.log('🧪 Testing announcement creation...');
    
    const testAnnouncement = {
      title: 'Test Announcement',
      content: 'This is a test announcement to verify the schema fix',
      isActive: false,
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      borderColor: '#1d4ed8',
      priority: 'low'
    };

    const result = await storage.createAnnouncement(testAnnouncement);
    console.log('✅ Test announcement created successfully:', result.id);
    
    // Clean up test announcement
    await storage.deleteAnnouncement(result.id);
    console.log('🧹 Cleaned up test announcement');
    
    console.log('🎉 Announcement creation is working correctly!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testAnnouncementCreation();