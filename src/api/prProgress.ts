import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET': {
      const { prUrl } = req.query;
      const { data, error } = await supabase
        .from('pr_progress')
        .select('*')
        .eq('pr_url', prUrl)
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json(data);
    }

    case 'POST': {
      const { progress, currentStage, prUrls } = req.body;
      const updates = prUrls.map(prUrl => ({
        pr_url: prUrl,
        progress,
        current_stage: currentStage
      }));

      const { data: upsertData, error: upsertError } = await supabase
        .from('pr_progress')
        .upsert(updates);

      if (upsertError) {
        return res.status(500).json({ error: upsertError.message });
      }
      return res.status(200).json(upsertData);
    }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}