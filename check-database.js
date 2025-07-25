import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function checkDatabase() {
  console.log('🔍 Checking database tables and data...\n');

  try {
    // Check users table
    console.log('👥 Users table:');
    const { data: users, error: usersError, count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact' });
    
    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
    } else {
      console.log(`✅ Found ${usersCount} users`);
      if (users && users.length > 0) {
        console.log('Sample user:', {
          id: users[0].id,
          email: users[0].email,
          role: users[0].role,
          status: users[0].status
        });
      }
    }

    // Check live reply templates table
    console.log('\n📝 Live Reply Templates table:');
    const { data: liveTemplates, error: liveError, count: liveCount } = await supabase
      .from('live_reply_templates')
      .select('*', { count: 'exact' });
    
    if (liveError) {
      console.log('❌ Live templates table error:', liveError.message);
    } else {
      console.log(`✅ Found ${liveCount} live reply templates`);
      if (liveTemplates && liveTemplates.length > 0) {
        console.log('Sample template:', {
          id: liveTemplates[0].id,
          name: liveTemplates[0].name,
          category: liveTemplates[0].category,
          genre: liveTemplates[0].genre,
          is_active: liveTemplates[0].is_active
        });
      }
    }

    // Check email templates table
    console.log('\n📧 Email Templates table:');
    const { data: emailTemplates, error: emailError, count: emailCount } = await supabase
      .from('email_templates')
      .select('*', { count: 'exact' });
    
    if (emailError) {
      console.log('❌ Email templates table error:', emailError.message);
    } else {
      console.log(`✅ Found ${emailCount} email templates`);
      if (emailTemplates && emailTemplates.length > 0) {
        console.log('Sample email template:', {
          id: emailTemplates[0].id,
          name: emailTemplates[0].name,
          category: emailTemplates[0].category
        });
      }
    }

    // Check site content table
    console.log('\n🌐 Site Content table:');
    const { data: siteContent, error: siteError, count: siteCount } = await supabase
      .from('site_content')
      .select('*', { count: 'exact' });
    
    if (siteError) {
      console.log('❌ Site content table error:', siteError.message);
    } else {
      console.log(`✅ Found ${siteCount} site content items`);
      if (siteContent && siteContent.length > 0) {
        console.log('Sample site content:', {
          id: siteContent[0].id,
          key: siteContent[0].key,
          content: siteContent[0].content?.substring(0, 50) + '...'
        });
      }
    }

    // Check announcements table
    console.log('\n📢 Announcements table:');
    const { data: announcements, error: announcementsError, count: announcementsCount } = await supabase
      .from('announcements')
      .select('*', { count: 'exact' });
    
    if (announcementsError) {
      console.log('❌ Announcements table error:', announcementsError.message);
    } else {
      console.log(`✅ Found ${announcementsCount} announcements`);
      if (announcements && announcements.length > 0) {
        console.log('Sample announcement:', {
          id: announcements[0].id,
          title: announcements[0].title,
          is_active: announcements[0].is_active
        });
      }
    }

    // Get all table names
    console.log('\n📊 All tables in database:');
    const { data: tableData, error: tableError } = await supabase.rpc('get_tables');
    if (tableError) {
      console.log('❌ Error getting table list:', tableError.message);
    } else if (tableData) {
      console.log('Tables:', tableData);
    }

  } catch (error) {
    console.error('🚨 Database check failed:', error);
  }
}

checkDatabase();