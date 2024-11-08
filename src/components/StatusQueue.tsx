import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

interface StatusQueueProps {
  current_stage: string;
}

const StatusQueue: React.FC<StatusQueueProps> = ({ current_stage }) => {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueueCount = useCallback(async () => {
    console.log('🔄 Fetching queue count for stage:', current_stage);
    
    if (!current_stage) {
      console.log('⚠️ No stage provided, resetting count');
      setCount(null);
      setIsLoading(false);
      return;
    }

    try {
      console.log('📊 Starting database query for stage:', current_stage);
      setIsLoading(true);
      
      const { data, error, count: queueCount } = await supabase
        .from('pr_progress')
        .select('*', { count: 'exact', head: true })
        .eq('current_stage', current_stage);
      
      console.log('📥 Query response:', {
        count: queueCount,
        error: error || 'None',
        data: data?.length
      });
      
      if (error) {
        console.error('❌ Error fetching queue count:', {
          error,
          current_stage,
          errorMessage: error.message,
          errorDetails: error.details
        });
        return;
      }
      
      console.log('✅ Successfully updated count for stage:', current_stage, 'Count:', queueCount);
      setCount(queueCount || 0);
    } catch (error) {
      console.error('💥 Unexpected error in fetchQueueCount:', {
        error,
        current_stage,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      console.log('🏁 Finished loading state for stage:', current_stage);
      setIsLoading(false);
    }
  }, [current_stage]);

  useEffect(() => {
    console.log('🎬 StatusQueue effect triggered for stage:', current_stage);
    fetchQueueCount();

    if (current_stage) {
      console.log('📡 Setting up realtime subscription for stage:', current_stage);
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
          (payload) => {
            console.log('🔔 Realtime update received:', {
              event: payload.eventType,
              current_stage,
              payload
            });
            fetchQueueCount();
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
        });

      return () => {
        console.log('📴 Cleaning up subscription for stage:', current_stage);
        supabase.removeChannel(subscription);
      };
    }
  }, [current_stage, fetchQueueCount]);

  if (!current_stage) {
    console.log('⏭️ Rendering null - no stage provided');
    return null;
  }

  if (isLoading) {
    console.log('⌛ Rendering loading state for stage:', current_stage);
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
    console.log('0️⃣ Rendering empty queue state for stage:', current_stage);
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

  console.log('✨ Rendering normal state - Count:', count, 'Stage:', current_stage);
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