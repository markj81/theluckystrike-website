const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 4000;
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Serve downloaded files statically
app.use('/audio', express.static(DOWNLOADS_DIR));

// Validate YouTube URL
function isValidYouTubeURL(url) {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]{11}/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]{11}/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]{11}/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]{11}/,
  ];
  return patterns.some((p) => p.test(url));
}

// Download YouTube audio
app.post('/api/download', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!isValidYouTubeURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL. Please provide a valid YouTube video link.' });
  }

  const fileId = uuidv4();
  const outputPath = path.join(DOWNLOADS_DIR, `${fileId}.wav`);

  // Use yt-dlp to download and convert to WAV
  const ytdlp = spawn('yt-dlp', [
    '--no-playlist',
    '-x',                           // Extract audio
    '--audio-format', 'wav',        // Convert to WAV
    '--audio-quality', '0',         // Best quality
    '-o', outputPath.replace('.wav', '.%(ext)s'), // Output template
    '--postprocessor-args', '-ar 44100 -ac 2',    // 44.1kHz stereo
    url,
  ]);

  let stderr = '';
  let progressData = '';

  ytdlp.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  ytdlp.stdout.on('data', (data) => {
    progressData += data.toString();
  });

  ytdlp.on('close', (code) => {
    if (code !== 0) {
      console.error('yt-dlp error:', stderr);
      return res.status(500).json({
        error: 'Failed to download audio. Please check the URL and try again.',
        details: stderr,
      });
    }

    // yt-dlp may output with a different extension before converting
    // Check if the WAV file exists
    if (!fs.existsSync(outputPath)) {
      // Try to find the file with the ID prefix
      const files = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.startsWith(fileId));
      if (files.length > 0) {
        const actualFile = files[0];
        const actualPath = path.join(DOWNLOADS_DIR, actualFile);
        // If it's not a WAV, that's unexpected — but we'll try to serve it
        return res.json({
          success: true,
          fileId,
          audioUrl: `/audio/${actualFile}`,
          filename: actualFile,
        });
      }
      return res.status(500).json({ error: 'Audio file was not created. Download may have failed.' });
    }

    res.json({
      success: true,
      fileId,
      audioUrl: `/audio/${fileId}.wav`,
      filename: `${fileId}.wav`,
    });
  });

  ytdlp.on('error', (err) => {
    console.error('Failed to start yt-dlp:', err.message);
    res.status(500).json({
      error: 'yt-dlp is not installed or not found in PATH. Please install yt-dlp.',
    });
  });
});

// Get audio info without downloading
app.post('/api/info', (req, res) => {
  const { url } = req.body;

  if (!url || !isValidYouTubeURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  const ytdlp = spawn('yt-dlp', ['--dump-json', '--no-playlist', url]);

  let stdout = '';
  let stderr = '';

  ytdlp.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  ytdlp.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  ytdlp.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: 'Failed to get video info' });
    }

    try {
      const info = JSON.parse(stdout);
      res.json({
        title: info.title || 'Unknown',
        duration: info.duration || 0,
        thumbnail: info.thumbnail || '',
        uploader: info.uploader || 'Unknown',
      });
    } catch {
      res.status(500).json({ error: 'Failed to parse video info' });
    }
  });

  ytdlp.on('error', (err) => {
    console.error('Failed to start yt-dlp for info:', err.message);
    res.status(500).json({
      error: 'yt-dlp is not installed or not found in PATH. Please install yt-dlp.',
    });
  });
});

// Cleanup old files (older than 1 hour)
setInterval(() => {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();

  fs.readdir(DOWNLOADS_DIR, (err, files) => {
    if (err) return;
    files.forEach((file) => {
      const filePath = path.join(DOWNLOADS_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (now - stats.mtimeMs > ONE_HOUR) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}, 15 * 60 * 1000); // Run every 15 minutes

// In production, serve the React build
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  }
}

app.listen(PORT, () => {
  console.log(`DJ Sample Server running on http://localhost:${PORT}`);
});
