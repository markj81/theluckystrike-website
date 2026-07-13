import React, { useState } from 'react';
import { API_BASE } from '../types';

interface YouTubeInputProps {
  onAudioLoaded: (url: string, title: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const YouTubeInput: React.FC<YouTubeInputProps> = ({
  onAudioLoaded,
  isLoading,
  setIsLoading,
  setError,
}) => {
  const [url, setUrl] = useState('');
  const [progress, setProgress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress('Fetching video info...');

    try {
      // First get video info
      let title = 'Unknown Track';
      try {
        const infoRes = await fetch(`${API_BASE}/api/info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() }),
        });
        if (infoRes.ok) {
          const info = await infoRes.json();
          title = info.title || title;
        }
      } catch (infoErr) {
        console.warn('Could not fetch video info, continuing with download...', infoErr);
      }

      setProgress('Downloading and converting audio... This may take a moment.');

      // Download audio
      const downloadRes = await fetch(`${API_BASE}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const responseText = await downloadRes.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error('Server returned an invalid response. Is the backend running?');
      }

      if (!downloadRes.ok) {
        throw new Error(data.error || 'Failed to download audio');
      }
      const audioUrl = `${API_BASE}${data.audioUrl}`;

      setProgress('Audio ready!');
      onAudioLoaded(audioUrl, title);
    } catch (err: any) {
      setError(err.message || 'An error occurred while downloading');
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  };

  return (
    <div className="panel">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span className="text-2xl">🎵</span>
        Load from YouTube
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube URL here..."
          className="flex-1 bg-mpc-bg border border-gray-700 rounded-lg px-4 py-2.5
                     text-mpc-text placeholder-mpc-text-dim focus:outline-none
                     focus:border-mpc-accent focus:ring-1 focus:ring-mpc-accent
                     font-mono text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex items-center gap-2 min-w-[120px] justify-center"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"
                  className="opacity-25"
                />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  className="opacity-75"
                />
              </svg>
              Loading...
            </>
          ) : (
            'Download'
          )}
        </button>
      </form>

      {progress && (
        <div className="mt-3 flex items-center gap-2 text-sm text-mpc-text-dim">
          {isLoading && (
            <div className="w-2 h-2 bg-mpc-accent rounded-full animate-pulse-slow" />
          )}
          {progress}
        </div>
      )}
    </div>
  );
};

export default YouTubeInput;
