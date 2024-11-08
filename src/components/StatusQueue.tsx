import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

interface StatusQueueProps {
  stage: string;
}

const StatusQueue: React.FC<StatusQueueProps> = ({ stage }) => {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<string | null>(null);

  const fetchQueueCount = useCallback(async () => {
    if (!stage) {
      setCount(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, count: queueCount, error } = await supabase
        .from('pr_progress')
        .select('current_stage', { count: 'exact' })
        .eq('current_stage', stage)
        .not('progress', 'eq', 100);

      if (error) throw error;

      if (data && data.length > 0) {
        setCurrentStage(data[0].current_stage);
        setCount(queueCount || 0);
      } else {
        setCurrentStage(stage);
        setCount(0);
      }
    } catch (error) {
      console.error('Error fetching queue count:', error);
      setError('Failed to fetch queue count');
      setCount(null);
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
          table: 'pr_progress',
          filter: `current_stage=eq.${stage}`,
        },
        () => {
          fetchQueueCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [stage, fetchQueueCount]);

  if (!stage) return null;

  if (error) {
    return (
      <div className="mt-2 bg-gray-800/50 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-2 bg-gray-800/50 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="mt-2 bg-gray-800/50 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-sm text-gray-400">
            No PRs in this stage
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 bg-gray-800/50 rounded-lg p-3">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-sm text-gray-400">
          {count} {count === 1 ? 'PR is' : 'PRs are'} currently in this stage
        </span>
      </div>
    </div>
  );
};

export default StatusQueue; 