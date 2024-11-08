import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

interface StatusQueueProps {
  stage: string;
}

const StatusQueue: React.FC<StatusQueueProps> = ({ stage }) => {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueueCount = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error, count: queueCount } = await supabase
        .from('pr_progress')
        .select('*', { count: 'exact' })
        .eq('current_stage', stage);
      
      if (error) {
        console.error('Error fetching queue count:', error);
        return;
      }
      
      setCount(queueCount);
    } catch (error) {
      console.error('Error in fetchQueueCount:', error);
    } finally {
      setIsLoading(false);
    }
  }, [stage]);

  useEffect(() => {
    fetchQueueCount();

    const subscription = supabase
      .channel('pr_progress_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pr_progress'
        },
        fetchQueueCount
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [stage, fetchQueueCount]);

  if (isLoading) {
    return (
      <div className="mt-2 px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-sm font-medium text-gray-300">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="mt-2 px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-sm font-medium text-gray-300">
            No PRs in this stage
          </span>
        </div>
      </div>
    );
  }

  if (count === null) return null;

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