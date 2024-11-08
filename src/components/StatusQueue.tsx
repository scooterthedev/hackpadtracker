import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

interface StatusQueueProps {
  stage: string;
}

const StatusQueue: React.FC<StatusQueueProps> = ({ stage }) => {
  const [count, setCount] = useState(0);

  const fetchQueueCount = useCallback(async () => {
    const { count: queueCount } = await supabase
      .from('pr_progress')
      .select('*', { count: 'exact', head: true })
      .eq('current_stage', stage);
    
    setCount(queueCount || 0);
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
        () => {
          fetchQueueCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [stage, fetchQueueCount]);

  return (
    <div className="text-sm text-gray-400">
      {count > 0 && (
        <span>
          {count} {count === 1 ? 'PR is' : 'PRs are'} currently in this stage
        </span>
      )}
    </div>
  );
};

export default StatusQueue; 