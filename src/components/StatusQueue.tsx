import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

interface StatusQueueProps {
  current_stage: string;
}

const StatusQueue: React.FC<StatusQueueProps> = ({ current_stage }) => {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueueCount = useCallback(async () => {
    if (!current_stage) {
      setCount(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { error, count: queueCount } = await supabase
        .from('pr_progress')
        .select('*', { count: 'exact', head: true })
        .eq('current_stage', current_stage);

      if (error) {
        console.error('Error fetching queue count:', error);
        return;
      }

      setCount(queueCount || 0);
    } catch (error) {
      console.error('Error in fetchQueueCount:', error);
    } finally {
      setIsLoading(false);
    }
  }, [current_stage]);

  useEffect(() => {
    fetchQueueCount();

    if (current_stage) {
      const subscription = supabase
        .channel('pr_progress_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pr_progress',
            filter: `current_stage=eq.${current_stage}`
          },
          () => {
            fetchQueueCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [current_stage, fetchQueueCount]);

  if (!current_stage || isLoading) {
    return null;
  }

  return (
    <div className="mt-2 px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-700">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-sm font-medium text-gray-300">
          {count} {count === 1 ? 'PR is' : 'PRs are'} currently in this stage
        </span>
      </div>
    </div>
  );
};

export default StatusQueue;