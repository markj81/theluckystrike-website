/// <reference types="vite/client" />

declare module 'audiobuffer-to-wav' {
  function audioBufferToWav(buffer: AudioBuffer, options?: { float32?: boolean }): ArrayBuffer;
  export default audioBufferToWav;
}
