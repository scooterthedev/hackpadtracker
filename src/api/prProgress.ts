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

      if (!prUrls) {
        const { data: allPRs, error: fetchError } = await supabase
          .from('pr_progress')
          .select('pr_url, current_stage');

        if (fetchError) {
          return res.status(500).json({ error: fetchError.message });
        }

        const updates = allPRs.map(pr => ({
          pr_url: pr.pr_url,
          progress: 49,
          current_stage: pr.current_stage
        }));

        const { data: upsertData, error: upsertError } = await supabase
          .from('pr_progress')
          .upsert(updates);

        if (upsertError) {
          return res.status(500).json({ error: upsertError.message });
        }
        return res.status(200).json(upsertData);
      }

      const updates = prUrls.map((prUrl: string) => ({
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