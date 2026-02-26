import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import { Audio, type AVPlaybackSource, type AVPlaybackStatus } from "expo-av";
import { MotiView } from "moti";

import { buildApiUrl } from "@/lib/api";
import * as storage from "@/lib/storage";

interface AttachmentAudioPlayerProps {
  endpoint: string;
  label?: string;
  compact?: boolean;
  speakerName?: string;
  subtitle?: string;
  badge?: string;
}

const DEFAULT_WAVE_LEVELS = [0.3, 0.52, 0.76, 0.46, 0.68, 0.5, 0.72, 0.6, 0.44, 0.66, 0.48, 0.58];

function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "00:00";
  }
  const seconds = Math.floor(totalSeconds);
  const minute = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const second = (seconds % 60).toString().padStart(2, "0");
  return `${minute}:${second}`;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export default function AttachmentAudioPlayer({
  endpoint,
  label = "语音内容",
  compact = false,
  speakerName = "求助者",
  subtitle = "刚刚",
  badge = "text-audio",
}: AttachmentAudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [waveLevels, setWaveLevels] = useState<number[]>(DEFAULT_WAVE_LEVELS);

  const playbackProgress = useMemo(
    () => clamp01(durationSec > 0 ? positionSec / durationSec : 0),
    [durationSec, positionSec]
  );

  const cleanup = useCallback(async () => {
    const sound = soundRef.current;
    soundRef.current = null;
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch {
        // Ignore unload errors.
      }
    }

    const webAudio = webAudioRef.current;
    webAudioRef.current = null;
    if (webAudio) {
      webAudio.pause();
      webAudio.src = "";
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    analyserRef.current = null;
    frequencyDataRef.current = null;

    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context) {
      void context.close().catch(() => {
        // Ignore close errors.
      });
    }
  }, []);

  useEffect(() => {
    void cleanup();
    setIsPlaying(false);
    setError(null);
    setPositionSec(0);
    setDurationSec(0);
    setWaveLevels(DEFAULT_WAVE_LEVELS);
  }, [endpoint, cleanup]);

  useEffect(() => {
    return () => {
      void cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = setInterval(() => {
      const analyser = analyserRef.current;
      const frequencyData = frequencyDataRef.current;

      if (Platform.OS === "web" && analyser && frequencyData) {
        analyser.getByteFrequencyData(frequencyData);
        const levels = Array.from({ length: 12 }, (_, index) => {
          const sampleIndex = Math.floor((index / 12) * frequencyData.length);
          return Math.max(0.2, frequencyData[sampleIndex] / 255);
        });
        setWaveLevels(levels);
        return;
      }

      const fallbackLevels = Array.from({ length: 12 }, (_, index) => {
        const base = 0.32 + ((index % 5) * 0.1);
        const pulse = (Math.sin((Date.now() / 260) + index) + 1) / 2;
        return Math.min(1, base + pulse * 0.34);
      });
      setWaveLevels(fallbackLevels);
    }, 120);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const onPlaybackStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }

    const nextDuration = typeof status.durationMillis === "number"
      ? status.durationMillis / 1000
      : durationSec;
    const nextPosition = typeof status.positionMillis === "number"
      ? status.positionMillis / 1000
      : positionSec;

    setDurationSec(nextDuration);
    setPositionSec(nextPosition);
    setIsPlaying(status.isPlaying);

    if (status.didJustFinish) {
      setPositionSec(0);
      setIsPlaying(false);
    }
  };

  const buildSource = useCallback(async (): Promise<AVPlaybackSource> => {
    const token = await storage.getItem("access_token");
    const absoluteUrl = buildApiUrl(endpoint);
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return { uri: absoluteUrl, headers };
  }, [endpoint]);

  const ensureSound = useCallback(async (): Promise<Audio.Sound> => {
    if (soundRef.current) {
      return soundRef.current;
    }

    const source = await buildSource();
    const { sound } = await Audio.Sound.createAsync(
      source,
      { shouldPlay: false, progressUpdateIntervalMillis: 120 },
      onPlaybackStatus
    );
    soundRef.current = sound;
    return sound;
  }, [buildSource]);

  const ensureWebAudio = useCallback(async (): Promise<HTMLAudioElement> => {
    if (webAudioRef.current) {
      return webAudioRef.current;
    }

    const token = await storage.getItem("access_token");
    const absoluteUrl = buildApiUrl(endpoint);
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const response = await fetch(absoluteUrl, { headers });
    if (!response.ok) {
      throw new Error(`Audio fetch failed: ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    objectUrlRef.current = objectUrl;

    const audio = new window.Audio(objectUrl);
    audio.preload = "metadata";

    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDurationSec(audio.duration);
      }
    };
    audio.ontimeupdate = () => {
      setPositionSec(audio.currentTime || 0);
    };
    audio.onended = () => {
      setIsPlaying(false);
      setPositionSec(0);
    };

    const factory = globalThis as typeof globalThis & {
      AudioContext?: new () => AudioContext;
      webkitAudioContext?: new () => AudioContext;
    };
    const AudioContextCtor = factory.AudioContext ?? factory.webkitAudioContext;

    if (AudioContextCtor) {
      const audioContext = new AudioContextCtor();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      frequencyDataRef.current = new Uint8Array(
        new ArrayBuffer(analyser.frequencyBinCount)
      );
    }

    webAudioRef.current = audio;
    return audio;
  }, [endpoint]);

  const onToggle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (Platform.OS === "web") {
        const audio = await ensureWebAudio();
        const context = audioContextRef.current;
        if (context && context.state === "suspended") {
          await context.resume();
        }

        if (audio.paused) {
          await audio.play();
          setIsPlaying(true);
        } else {
          audio.pause();
          setIsPlaying(false);
        }
        return;
      }

      const sound = await ensureSound();
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        setError("语音暂时不可用");
        return;
      }

      if (status.isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (playbackError) {
      console.error("Attachment audio playback failed", playbackError);
      setError("语音加载失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [ensureSound, ensureWebAudio]);

  const onPressPlay = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation?.();
      void onToggle();
    },
    [onToggle]
  );

  const avatarInitial = speakerName.trim().slice(0, 1).toUpperCase() || "U";
  const rightTime = durationSec > 0 ? formatClock(durationSec) : "--:--";
  const waveBarWidth = compact ? 3 : 4;
  const waveGap = compact ? 3 : 4;
  const waveTrackHeight = compact ? 22 : 26;

  return (
    <View
      className={`relative overflow-hidden rounded-2xl border border-cyan-200/90 bg-white/95 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <MotiView
        pointerEvents="none"
        from={{ opacity: 0.2, scale: 0.92 }}
        animate={{ opacity: 0.35, scale: 1.05 }}
        transition={{ type: "timing", duration: 2200, loop: true }}
        className="absolute -right-10 -top-8 h-24 w-24 rounded-full bg-cyan-100/70"
      />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-slate-900">
            <Text className="text-sm font-semibold text-white">{avatarInitial}</Text>
          </View>
          <View>
            <Text className={`${compact ? "text-xs" : "text-sm"} font-semibold text-slate-900`}>
              {speakerName}
            </Text>
            <Text className="text-xs text-slate-500">{subtitle}</Text>
          </View>
        </View>

        <Text className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500">
          {badge}
        </Text>
      </View>

      <View className={`mt-3 rounded-xl border border-slate-200 bg-slate-50/80 ${compact ? "p-2.5" : "p-3"}`}>
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={onPressPlay}
            disabled={loading}
            className={`h-11 w-11 items-center justify-center rounded-full ${isPlaying ? "bg-cyan-600" : "bg-cyan-500"}`}
          >
            {({ pressed }) => (
              <MotiView
                animate={{ scale: pressed ? 0.9 : 1 }}
                transition={{ type: "timing", duration: 100 }}
              >
                <Text className="pl-[1px] text-base font-semibold text-white">
                  {loading ? "..." : isPlaying ? "||" : "▶"}
                </Text>
              </MotiView>
            )}
          </Pressable>

          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text className={`${compact ? "text-xs" : "text-sm"} font-semibold text-slate-800`}>
                {label}
              </Text>
              <Text className={`${compact ? "text-[11px]" : "text-xs"} text-slate-500`}>
                {rightTime}
              </Text>
            </View>

            <View className="mt-2 flex-row items-end" style={{ height: waveTrackHeight }}>
              {waveLevels.map((value, index) => {
                const height = 6 + value * (compact ? 14 : 18);
                const width = waveBarWidth + value * (compact ? 1.4 : 1.8);
                return (
                  <View
                    key={`${endpoint}-${index}`}
                    className="items-center justify-end"
                    style={{
                      width,
                      marginRight: index === waveLevels.length - 1 ? 0 : waveGap,
                    }}
                  >
                    <View
                      style={{
                        width,
                        height,
                        borderRadius: 999,
                        backgroundColor: "#06B6D4",
                        opacity: isPlaying ? 0.95 : 0.62,
                        transform: [{ scaleY: isPlaying ? 1 : 0.86 }],
                      }}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <MotiView
            style={{
              height: "100%",
              borderRadius: 999,
              backgroundColor: "#06B6D4",
            }}
            animate={{ width: `${Math.max(8, playbackProgress * 100)}%` }}
            transition={{ type: "timing", duration: 160 }}
          />
        </View>
      </View>

      {error ? <Text className="mt-2 text-xs text-rose-500">{error}</Text> : null}
    </View>
  );
}
