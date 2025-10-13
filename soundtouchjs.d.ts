declare module 'soundtouchjs' {
  export class SoundTouch {
    constructor();
    pitch: number;
    tempo: number;
    rate: number;
  }

  export class SimpleFilter {
    constructor(sourceSound: AudioBuffer, soundTouch: SoundTouch);
    sourcePosition: number;
    extract(output: Float32Array, numFrames: number): number;
  }
}

