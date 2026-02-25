import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import { Audio, type AVPlaybackSource, type AVPlaybackStatus } from "expo-av";

import { buildApiUrl } from "@/lib/api";
import * as storage from "@/lib/storage";

interface AttachmentAudioPlayerProps {
  endpoint: string;
  label?: string;
  compact?: boolean;
}

export default function AttachmentAudioPlayer({
  endpoint,
  label = "语音",
  compact = false,
}: AttachmentAudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanup = useCallback(async () => {
    const sound = soundRef.current;
    soundRef.current = null;
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch {
        // Ignore cleanup errors.
      }
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    void cleanup();
    setIsPlaying(false);
    setError(null);
  }, [endpoint, cleanup]);

  useEffect(() => {
    return () => {
      void cleanup();
    };
  }, [cleanup]);

  const onPlaybackStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }
    setIsPlaying(status.isPlaying);
  };

  const buildSource = useCallback(async (): Promise<AVPlaybackSource> => {
    const token = await storage.getItem("access_token");
    const absoluteUrl = buildApiUrl(endpoint);
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    if (Platform.OS === "web") {
      const response = await fetch(absoluteUrl, { headers });
      if (!response.ok) {
        throw new Error(`Audio fetch failed: ${response.status}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;
      return { uri: objectUrl };
    }

    return { uri: absoluteUrl, headers };
  }, [endpoint]);

  const ensureSound = useCallback(async (): Promise<Audio.Sound> => {
    if (soundRef.current) {
      return soundRef.current;
    }
    const source = await buildSource();
    const { sound } = await Audio.Sound.createAsync(
      source,
      { shouldPlay: false },
      onPlaybackStatus
    );
    soundRef.current = sound;
    return sound;
  }, [buildSource]);

  const onToggle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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
    } catch {
      setError("语音加载失败");
    } finally {
      setLoading(false);
    }
  }, [ensureSound]);

  const onPressPlay = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation?.();
      void onToggle();
    },
    [onToggle]
  );

  return (
    <View
      className={`rounded-xl border border-cyan-200/40 bg-cyan-100/10 ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
    >
      <Text className={`${compact ? "text-xs" : "text-sm"} text-cyan-100`}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPressPlay}
        disabled={loading}
        className="mt-2 rounded-lg bg-cyan-500/85 px-3 py-2"
      >
        <Text className="text-center text-sm font-semibold text-slate-950">
          {loading ? "加载中..." : isPlaying ? "暂停语音" : "播放语音"}
        </Text>
      </Pressable>
      {error ? <Text className="mt-2 text-xs text-rose-200">{error}</Text> : null}
    </View>
  );
}
