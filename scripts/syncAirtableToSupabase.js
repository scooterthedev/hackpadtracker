const { fetchAirtableData, listenForAirtableChanges } = require('../src/utils/airtableClient');
const { supabase } = require('../src/utils/supabaseClient');

async function syncAirtableToSupabase() {
  try {
    const airtableData = await fetchAirtableData();

    for (const record of airtableData.records) {
      const prUrl = record.fields['Pull Request URL'];
      const partsPrinted = record.fields['Parts Printed?'];
      const pcbsOrdered = record.fields['PCBs & Parts Ordered?'];
      const soldered = record.fields['Soldered?'];

      let currentStage = '';
      let progress = 0;

      if (soldered) {
        currentStage = 'Soldering';
        progress = 68;
      } else if (pcbsOrdered) {
        currentStage = 'Ordering PCBs';
      } else if (partsPrinted) {
        currentStage = 'Printing your 3D Case!';
      }

      const { data, error } = await supabase
        .from('pr_progress')
        .upsert(
          { pr_url: prUrl, current_stage: currentStage, progress },
          { onConflict: 'pr_url' }
        );

      if (error) {
        console.error('Error updating Supabase:', error);
      } else {
        console.log('Supabase updated successfully:', data);
      }
    }
  } catch (error) {
    console.error('Error syncing Airtable to Supabase:', error);
  }
}

listenForAirtableChanges(syncAirtableToSupabase);
