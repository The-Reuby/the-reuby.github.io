import { useState, useEffect } from 'react';
import { Issue, IssueMeta } from '../types';

export const useIssue = (initialSlug?: string) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [issueMeta, setIssueMeta] = useState<IssueMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch('/data/issues.json');
        if (!response.ok) {
          throw new Error('Failed to fetch issues');
        }
        const data = await response.json();
        setIssues(data);

        // Set the initial issue
        if (initialSlug && data.some((issue: Issue) => issue.slug === initialSlug)) {
          setCurrentIssue(data.find((issue: Issue) => issue.slug === initialSlug) || null);
        } else if (data.length > 0) {
          setCurrentIssue(data[0]);
        }
      } catch (err) {
        setError('Failed to load issues. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [initialSlug]);

  useEffect(() => {
    const fetchIssueMeta = async () => {
      if (!currentIssue) return;

      try {
        setLoading(true);
        const response = await fetch(`/data/${currentIssue.slug}.json`);
        if (!response.ok) {
          throw new Error(`Failed to fetch issue metadata for ${currentIssue.slug}`);
        }
        const data = await response.json();
        setIssueMeta(data);
      } catch (err) {
        setError(`Failed to load issue metadata for ${currentIssue.slug}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (currentIssue) {
      fetchIssueMeta();
    }
  }, [currentIssue]);

  const changeIssue = (slug: string) => {
    const issue = issues.find(i => i.slug === slug);
    if (issue) {
      setCurrentIssue(issue);
    }
  };

  return {
    issues,
    currentIssue,
    issueMeta,
    loading,
    error,
    changeIssue
  };
}; 