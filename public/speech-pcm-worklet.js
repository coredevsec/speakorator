const TARGET_SAMPLE_RATE = 16000;
const CHUNK_LENGTH = 3200;

class SpeechPcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phase = 0;
    this.previousSample = 0;
    this.hasPreviousSample = false;
    this.chunk = new Int16Array(CHUNK_LENGTH);
    this.chunkLength = 0;
    this.port.onmessage = (event) => {
      if (event.data === "flush") this.flush();
    };
  }

  appendSample(sample) {
    const clipped = Math.max(-1, Math.min(1, sample));
    this.chunk[this.chunkLength] = clipped < 0 ? clipped * 32768 : clipped * 32767;
    this.chunkLength += 1;
    if (this.chunkLength === CHUNK_LENGTH) this.flush();
  }

  flush() {
    if (this.chunkLength === 0) return;
    const output = this.chunk.slice(0, this.chunkLength);
    this.port.postMessage(output.buffer, [output.buffer]);
    this.chunk = new Int16Array(CHUNK_LENGTH);
    this.chunkLength = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0]?.[0];
    outputs[0]?.[0]?.fill(0);
    if (!input) return true;

    for (const sample of input) {
      if (this.hasPreviousSample) {
        let phaseBefore = this.phase;
        this.phase += TARGET_SAMPLE_RATE;
        while (this.phase >= sampleRate) {
          const fraction = (sampleRate - phaseBefore) / TARGET_SAMPLE_RATE;
          const resampled = this.previousSample + (sample - this.previousSample) * fraction;
          this.appendSample(resampled);
          this.phase -= sampleRate;
          phaseBefore = this.phase;
        }
      } else {
        this.hasPreviousSample = true;
        this.appendSample(sample);
      }
      this.previousSample = sample;
    }
    return true;
  }
}

registerProcessor("speech-pcm-processor", SpeechPcmProcessor);