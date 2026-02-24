import React from "react";
import { Image, Text, View } from "react-native";
import { MotiView } from "moti";

import GlassCard from "@/components/GlassCard";
import type { ShowcaseCard } from "@/lib/demo-data";

function AudioWave() {
  return (
    <View className="flex-row items-end gap-1">
      {[12, 20, 16, 24, 14, 22, 18, 26, 12, 20, 16].map((height, index) => (
        <View
          // eslint-disable-next-line react/no-array-index-key
          key={`${height}-${index}`}
          className="w-[4px] rounded-full bg-sky-400/90"
          style={{ height }}
        />
      ))}
    </View>
  );
}

export default function ShowcaseMediaCard({
  card,
  index,
}: {
  card: ShowcaseCard;
  index: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 22 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 300, delay: index * 70 }}
    >
      <GlassCard tone="light" className="shadow-sm" contentClassName="p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-slate-900">
              <Text className="text-sm font-semibold text-white">{card.author.slice(0, 1)}</Text>
            </View>
            <View>
              <Text className="text-sm font-semibold text-slate-900">{card.author}</Text>
              <Text className="text-xs text-slate-500">{card.postedAt}</Text>
            </View>
          </View>
          <Text className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{card.kind}</Text>
        </View>

        {card.kind === "text-image" && card.imageUrl ? (
          <View className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80">
            <Image source={{ uri: card.imageUrl }} className="h-52 w-full" resizeMode="cover" />
          </View>
        ) : null}

        {card.kind === "text-video" && card.videoCoverUrl ? (
          <View className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200/80">
            <Image source={{ uri: card.videoCoverUrl }} className="h-52 w-full" resizeMode="cover" />
            <View className="absolute inset-0 items-center justify-center bg-black/18">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-white/92">
                <Text className="pl-[2px] text-lg text-slate-900">▶</Text>
              </View>
            </View>
            <View className="absolute bottom-2 right-2 rounded-md bg-black/58 px-2 py-1">
              <Text className="text-xs font-semibold text-white">{card.videoDuration}</Text>
            </View>
          </View>
        ) : null}

        {card.kind === "text-audio" ? (
          <View className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-sky-500">
                <Text className="pl-[2px] text-base text-white">▶</Text>
              </View>
              <View className="flex-1 gap-2">
                <AudioWave />
                <View className="h-[6px] overflow-hidden rounded-full bg-slate-200">
                  <View className="h-full w-1/3 rounded-full bg-sky-500" />
                </View>
              </View>
              <Text className="text-xs font-semibold text-slate-500">{card.audioDuration}</Text>
            </View>
          </View>
        ) : null}

        <Text className="mt-4 text-accessible-base font-semibold text-slate-900">{card.title}</Text>
        <Text className="mt-2 text-accessible-sm leading-7 text-slate-700">{card.text}</Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          {card.tags.map((tag) => (
            <Text
              key={`${card.id}-${tag}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-[6px] text-xs text-slate-600"
            >
              #{tag}
            </Text>
          ))}
        </View>
      </GlassCard>
    </MotiView>
  );
}
