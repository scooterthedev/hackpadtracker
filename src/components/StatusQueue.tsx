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
      
      // First get the current stage
      const { data: stageData, error: stageError } = await supabase
        .from('pr_progress')
        .select('current_stage')
        .eq('current_stage', stage)
        .single();

      if (stageError) throw stageError;
      
      if (stageData) {
        setCurrentStage(stageData.current_stage);
      }

      // Then get the count for that stage
      const { count: queueCount, error: countError } = await supabase
        .from('pr_progress')
        .select('*', { count: 'exact', head: true })
        .eq('current_stage', stage)
        .not('progress', 'eq', 100)
        .throwOnError();
      
      if (countError) throw countError;
      
      setCount(queueCount || 0);
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

    if (stage) {
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
    }
  }, [stage, fetchQueueCount]);

  if (!stage) return null;

  if (error) {
    return (
      <div className="mt-2 px-3 py-1.5 bg-red-900/50 rounded-lg border border-red-700">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-sm font-medium text-red-300">
            {error}
          </span>
        </div>
      </div>
    );
  }

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

  return (
    <div className="mt-2 px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-700">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-sm font-medium text-gray-300">
          {count} {count === 1 ? 'PR is' : 'PRs are'} currently in {currentStage || stage}
        </span>
      </div>
    </div>
  );
};

export default StatusQueue; 