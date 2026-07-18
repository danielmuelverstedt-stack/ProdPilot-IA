"use client";
import { classifyVoiceLevel, type VoiceSignalQuality } from "../config/voice-diagnostic-defaults";
export interface MicrophoneDevice { id: string; label: string; isDefault: boolean }
export interface MicrophoneTestResult { blob: Blob | null; peak: number; quality: VoiceSignalQuality; durationSeconds: number }
export interface MicrophoneTestHandle { stop(): Promise<MicrophoneTestResult> }

export async function enumerateMicrophones(): Promise<MicrophoneDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((item) => item.kind === "audioinput").map((item, index) => ({ id: item.deviceId, label: item.label || `Microphone ${index + 1} — autorisez l’accès pour afficher son nom`, isDefault: item.deviceId === "default" }));
}

export async function startMicrophoneTest(input: { deviceId: string; durationSeconds: number; onLevel(level: number, peak: number, elapsed: number): void }): Promise<MicrophoneTestHandle> {
  if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === "undefined") throw new Error("unsupported");
  const stream = await navigator.mediaDevices.getUserMedia({ audio: input.deviceId ? { deviceId: { exact: input.deviceId } } : true });
  const context = new AudioContext(); const source = context.createMediaStreamSource(stream); const analyser = context.createAnalyser(); analyser.fftSize = 512; source.connect(analyser); const samples = new Uint8Array(analyser.fftSize);
  const chunks: BlobPart[] = []; const recorder = typeof MediaRecorder !== "undefined" ? new MediaRecorder(stream) : null; if (recorder) { recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); }; recorder.start(); }
  const started = performance.now(); let peak = 0; let frame = 0; let stopped = false;
  const measure = () => { analyser.getByteTimeDomainData(samples); let energy = 0; for (const sample of samples) { const value = (sample - 128) / 128; energy += value * value; } const level = Math.sqrt(energy / samples.length); peak = Math.max(peak, level); input.onLevel(level, peak, (performance.now() - started) / 1000); if (!stopped) frame = requestAnimationFrame(measure); }; frame = requestAnimationFrame(measure);
  const finish = async (): Promise<MicrophoneTestResult> => { if (stopped) return { blob: null, peak, quality: classifyVoiceLevel(peak), durationSeconds: (performance.now() - started) / 1000 }; stopped = true; cancelAnimationFrame(frame); const blob = await stopRecorder(recorder, chunks); stream.getTracks().forEach((track) => track.stop()); source.disconnect(); analyser.disconnect(); await context.close(); return { blob, peak, quality: classifyVoiceLevel(peak), durationSeconds: (performance.now() - started) / 1000 }; };
  return { stop: finish };
}
function stopRecorder(recorder: MediaRecorder | null, chunks: BlobPart[]): Promise<Blob | null> { if (!recorder || recorder.state === "inactive") return Promise.resolve(chunks.length ? new Blob(chunks) : null); return new Promise((resolve) => { recorder.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: recorder.mimeType }) : null); recorder.stop(); }); }
