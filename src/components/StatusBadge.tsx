import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, GitPullRequest } from 'lucide-react';

interface StatusBadgeProps {
  prUrl: string;
}

interface PRStatus {
  state: string;
  merged: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ prUrl }) => {
  const [status, setStatus] = useState<PRStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPRStatus = async () => {
      try {
        const prNumber = prUrl.split('/').pop();
        const response = await fetch(`https://api.github.com/repos/hackclub/hackpad/pulls/${prNumber}`);
        const data = await response.json();
        
        setStatus({
          state: data.state,
          merged: data.merged
        });
      } catch (error) {
        console.error('Error fetching PR status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPRStatus();
  }, [prUrl]);

  if (isLoading) {
    return (
      <div className="inline-flex items-center rounded-md text-xs font-medium">
        <span className="bg-gray-700 text-gray-200 px-2 py-0.5 rounded-l-md border-y border-l border-gray-600">
          pull request
        </span>
        <span className="bg-gray-600 text-gray-200 px-2 py-0.5 rounded-r-md border border-gray-600 animate-pulse">
          loading
        </span>
      </div>
    );
  }

  if (!status) return null;

  const getStatusConfig = () => {
    if (status.merged) {
      return {
        icon: CheckCircle,
        text: 'merged',
        labelColor: 'bg-gray-700',
        statusColor: 'bg-purple-600',
        borderColor: 'border-purple-700'
      };
    }

    switch (status.state) {
      case 'closed':
        return {
          icon: XCircle,
          text: 'closed',
          labelColor: 'bg-gray-700',
          statusColor: 'bg-red-600',
          borderColor: 'border-red-700'
        };
      case 'open':
        return {
          icon: GitPullRequest,
          text: 'open',
          labelColor: 'bg-gray-700',
          statusColor: 'bg-green-600',
          borderColor: 'border-green-700'
        };
      default:
        return {
          icon: GitPullRequest,
          text: status.state,
          labelColor: 'bg-gray-700',
          statusColor: 'bg-gray-600',
          borderColor: 'border-gray-600'
        };
    }
  };

  const { icon: Icon, text, labelColor, statusColor, borderColor } = getStatusConfig();

  return (
    <div className="inline-flex items-center rounded-md text-xs font-medium">
      <span className={`${labelColor} text-gray-200 px-2 py-0.5 rounded-l-md border-y border-l border-gray-600`}>
        pull request
      </span>
      <span className={`${statusColor} text-white px-2 py-0.5 rounded-r-md border ${borderColor} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {text}
      </span>
    </div>
  );
};

export default StatusBadge; 