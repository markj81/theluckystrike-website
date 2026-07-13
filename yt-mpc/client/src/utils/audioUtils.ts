/**
 * Transient detection for auto-chopping.
 * Uses onset detection via energy difference.
 */
export function detectTransients(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number,
  targetCount: number = 16
): number[] {
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  // Parameters for onset detection
  const hopSize = 512;
  const windowSize = 1024;

  // Calculate spectral flux / energy differences
  const energyDiffs: { sample: number; energy: number }[] = [];
  let prevEnergy = 0;

  for (let i = startSample; i < endSample - windowSize; i += hopSize) {
    let energy = 0;
    for (let j = 0; j < windowSize; j++) {
      const sample = channelData[i + j] || 0;
      energy += sample * sample;
    }
    energy /= windowSize;

    const diff = Math.max(0, energy - prevEnergy);
    energyDiffs.push({ sample: i, energy: diff });
    prevEnergy = energy;
  }

  if (energyDiffs.length === 0) {
    return evenlySpacedMarkers(startTime, endTime, targetCount);
  }

  // Find peaks in energy difference (adaptive threshold)
  const energyValues = energyDiffs.map((d) => d.energy);
  const meanEnergy = energyValues.reduce((a, b) => a + b, 0) / energyValues.length;
  const threshold = meanEnergy * 1.5;

  // Minimum distance between transients (in samples)
  const minDistance = Math.floor((endSample - startSample) / (targetCount * 2));

  const peaks: number[] = [];
  let lastPeakSample = -minDistance;

  for (let i = 1; i < energyDiffs.length - 1; i++) {
    const curr = energyDiffs[i];
    if (
      curr.energy > threshold &&
      curr.energy > energyDiffs[i - 1].energy &&
      curr.energy >= energyDiffs[i + 1].energy &&
      curr.sample - lastPeakSample >= minDistance
    ) {
      peaks.push(curr.sample / sampleRate);
      lastPeakSample = curr.sample;
    }
  }

  // Adjust to target count
  if (peaks.length === targetCount - 1) {
    // Perfect — these are the 15 marker positions (creating 16 slices)
    return peaks;
  } else if (peaks.length < targetCount - 1) {
    // Fewer than needed — subdivide largest gaps
    return subdivideToTarget(startTime, endTime, peaks, targetCount);
  } else {
    // More than needed — take the first (targetCount - 1) strongest
    return peaks.slice(0, targetCount - 1);
  }
}

function subdivideToTarget(
  startTime: number,
  endTime: number,
  markers: number[],
  targetCount: number
): number[] {
  const allPoints = [startTime, ...markers, endTime].sort((a, b) => a - b);
  const result = [...markers];

  while (result.length < targetCount - 1) {
    // Find the largest gap
    const sortedResult = [startTime, ...result, endTime].sort((a, b) => a - b);
    let maxGap = 0;
    let maxGapIndex = 0;

    for (let i = 1; i < sortedResult.length; i++) {
      const gap = sortedResult[i] - sortedResult[i - 1];
      if (gap > maxGap) {
        maxGap = gap;
        maxGapIndex = i;
      }
    }

    // Insert a midpoint in the largest gap
    const midpoint =
      (sortedResult[maxGapIndex - 1] + sortedResult[maxGapIndex]) / 2;
    result.push(midpoint);
  }

  return result.sort((a, b) => a - b).slice(0, targetCount - 1);
}

function evenlySpacedMarkers(
  startTime: number,
  endTime: number,
  count: number
): number[] {
  const duration = endTime - startTime;
  const step = duration / count;
  const markers: number[] = [];

  for (let i = 1; i < count; i++) {
    markers.push(startTime + step * i);
  }

  return markers;
}

/**
 * Slice an AudioBuffer into segments defined by marker times.
 */
export function sliceAudioBuffer(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number,
  markers: number[]
): AudioBuffer[] {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;

  // Create boundary points: [start, ...markers, end]
  const boundaries = [startTime, ...markers.sort((a, b) => a - b), endTime];
  const slices: AudioBuffer[] = [];

  for (let i = 0; i < boundaries.length - 1; i++) {
    const sliceStart = Math.floor(boundaries[i] * sampleRate);
    const sliceEnd = Math.floor(boundaries[i + 1] * sampleRate);
    const length = Math.max(1, sliceEnd - sliceStart);

    const offlineCtx = new OfflineAudioContext(
      numChannels,
      length,
      sampleRate
    );
    const sliceBuffer = offlineCtx.createBuffer(
      numChannels,
      length,
      sampleRate
    );

    for (let ch = 0; ch < numChannels; ch++) {
      const sourceData = audioBuffer.getChannelData(ch);
      const sliceData = sliceBuffer.getChannelData(ch);
      for (let s = 0; s < length; s++) {
        sliceData[s] = sourceData[sliceStart + s] || 0;
      }
    }

    slices.push(sliceBuffer);
  }

  return slices;
}
