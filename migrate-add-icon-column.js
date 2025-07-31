#!/usr/bin/env node

// Migration script to add missing 'icon' column to FAQs table in Supabase
import { createClient } from '@supabase/supabase-js';

async function addIconColumn() {
  console.log('Starting migration to add icon column to FAQs table...');

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required environment variables:');
    console.error('- VITE_SUPABASE_URL or SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('Connected to Supabase, executing migration...');
    
    // Add the icon column with default value
    const { data, error } = await supabase
      .from('faqs')
      .update({ icon: 'HelpCircle' })
      .is('icon', null)
      .select();

    console.log('Checking if icon column exists...');
    
    // Test if column exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('faqs')
      .select('icon')
      .limit(1);

    if (testError && testError.code === 'PGRST204') {
      console.log('Icon column does not exist, need to add it via SQL...');
      console.log('Please run this SQL in your Supabase SQL editor:');
      console.log('ALTER TABLE faqs ADD COLUMN IF NOT EXISTS icon varchar DEFAULT \'HelpCircle\';');
      console.log('UPDATE faqs SET icon = \'HelpCircle\' WHERE icon IS NULL;');
    } else if (testError) {
      console.error('Error testing column:', testError);
    } else {
      console.log('Icon column exists, updating null values...');
      
      // Update any FAQs that have null icon values
      const { data: updateData, error: updateError } = await supabase
        .from('faqs')
        .update({ icon: 'HelpCircle' })
        .is('icon', null)
        .select();

      if (updateError) {
        console.error('Error updating null values:', updateError);
      } else {
        console.log(`Updated ${updateData?.length || 0} FAQs with null icon values`);
      }
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  console.log('Migration completed successfully');
}

addIconColumn();