// Utility to initialize the site name in the database if it doesn't exist
export async function initializeSiteName() {
  try {
    // Check if site name already exists
    const response = await fetch('/api/site-content?key=site_name');
    const data = await response.json();
    
    // If no site name exists, create one with the default name
    if (data.length === 0) {
      console.log('[SiteName] No site name found, creating default...');
      
      const createResponse = await fetch('/api/site-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'site_name',
          content: 'BFL Customer Service Helper'
        })
      });
      
      if (createResponse.ok) {
        console.log('[SiteName] Default site name created successfully');
        return await createResponse.json();
      } else {
        console.error('[SiteName] Failed to create default site name');
      }
    } else {
      console.log('[SiteName] Site name already exists:', data[0].content);
      return data[0];
    }
  } catch (error) {
    console.error('[SiteName] Error initializing site name:', error);
  }
}