import { useCallback, useEffect, useRef, useState } from "react";

export type SelfHostedSpeechStatus = "idle" | "connecting" | "listening" | "error";

type SelfHostedSpeechOptions = {
  language: string;
  onTokens: (tokens: string[]) => void;
};

type SpeechMessage = {
  tokens?: unknown;
  error?: unknown;
};

const speechSocketUrl = import.meta.env["VITE_SPEECH_WS_URL"]?.trim() ?? "";

export function useSelfHostedSpeech({ language, onTokens }: SelfHostedSpeechOptions) {
  const [status, setStatus] = useState<SelfHostedSpeechStatus>("idle");
  const [error, setError] = useState("");
  const onTokensRef = useRef(onTokens);
  const languageRef = useRef(language);
  const sessionRef = useRef(0);
  const activeRef = useRef(false);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);

  onTokensRef.current = onTokens;
  languageRef.current = language;

  const releaseResources = useCallback((sendStop: boolean) => {
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket) {
      if (sendStop && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "stop" }));
      }
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    }

    processorRef.current?.port.postMessage("flush");
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const audioContext = audioContextRef.current;
    audioContextRef.current = null;
    if (audioContext && audioContext.state !== "closed") void audioContext.close();
  }, []);

  const stop = useCallback(() => {
    sessionRef.current += 1;
    activeRef.current = false;
    releaseResources(true);
    setStatus("idle");
  }, [releaseResources]);

  const start = useCallback(async () => {
    if (activeRef.current) return;
    if (!speechSocketUrl) {
      setError("Self-hosted speech is not configured. Set VITE_SPEECH_WS_URL and reload.");
      setStatus("error");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioWorkletNode) {
      setError("This browser does not support microphone capture with AudioWorklet.");
      setStatus("error");
      return;
    }

    activeRef.current = true;
    const sessionId = sessionRef.current + 1;
    sessionRef.current = sessionId;
    setError("");
    setStatus("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      if (sessionRef.current !== sessionId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      const socket = new WebSocket(speechSocketUrl);
      socket.binaryType = "arraybuffer";
      socketRef.current = socket;
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const timeout = { id: undefined as number | undefined };
        const fail = (cause: Error) => {
          if (settled) return;
          settled = true;
          if (timeout.id !== undefined) window.clearTimeout(timeout.id);
          reject(cause);
        };
        timeout.id = window.setTimeout(
          () => fail(new Error("Speech server connection timed out.")),
          10000,
        );
        socket.addEventListener(
          "open",
          () => {
            if (settled) return;
            settled = true;
            if (timeout.id !== undefined) window.clearTimeout(timeout.id);
            resolve();
          },
          { once: true },
        );
        socket.addEventListener(
          "error",
          () => fail(new Error("Could not connect to the speech server.")),
          { once: true },
        );
        socket.addEventListener(
          "close",
          () => fail(new Error("The speech server connection closed before it opened.")),
          { once: true },
        );
      });
      if (sessionRef.current !== sessionId) {
        releaseResources(false);
        return;
      }

      socket.addEventListener("message", (event: MessageEvent<string>) => {
        if (sessionRef.current !== sessionId || typeof event.data !== "string") return;
        let message: SpeechMessage;
        try {
          message = JSON.parse(event.data) as SpeechMessage;
        } catch {
          setError("The speech server returned an invalid response.");
          return;
        }
        if (typeof message.error === "string") {
          setError(message.error);
          setStatus("error");
          return;
        }
        if (Array.isArray(message.tokens)) {
          const tokens = message.tokens.filter(
            (token): token is string => typeof token === "string",
          );
          if (tokens.length > 0) onTokensRef.current(tokens);
        }
      });
      socket.addEventListener("close", () => {
        if (sessionRef.current !== sessionId || !activeRef.current) return;
        activeRef.current = false;
        releaseResources(false);
        setError("The speech server connection closed.");
        setStatus("error");
      });
      socket.send(JSON.stringify({ type: "start", language: languageRef.current }));

      const audioContext = new AudioContext({ latencyHint: "interactive" });
      audioContextRef.current = audioContext;
      await audioContext.audioWorklet.addModule("/speech-pcm-worklet.js");
      if (sessionRef.current !== sessionId) {
        releaseResources(false);
        return;
      }
      await audioContext.resume();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = new AudioWorkletNode(audioContext, "speech-pcm-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });
      sourceRef.current = source;
      processorRef.current = processor;
      processor.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (sessionRef.current === sessionId && socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      };
      source.connect(processor);
      processor.connect(audioContext.destination);
      setStatus("listening");
    } catch (cause) {
      if (sessionRef.current !== sessionId) return;
      activeRef.current = false;
      releaseResources(false);
      setError(cause instanceof Error ? cause.message : "Could not start self-hosted speech.");
      setStatus("error");
    }
  }, [releaseResources]);

  useEffect(
    () => () => {
      sessionRef.current += 1;
      activeRef.current = false;
      releaseResources(true);
    },
    [releaseResources],
  );

  return { configured: Boolean(speechSocketUrl), status, error, start, stop };
}
