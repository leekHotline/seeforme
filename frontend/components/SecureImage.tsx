import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Text,
  View,
  type ImageResizeMode,
  type ImageSourcePropType,
} from "react-native";

import { buildApiUrl } from "@/lib/api";
import * as storage from "@/lib/storage";

interface SecureImageProps {
  endpoint: string;
  className?: string;
  resizeMode?: ImageResizeMode;
}

export default function SecureImage({
  endpoint,
  className,
  resizeMode = "cover",
}: SecureImageProps) {
  const [source, setSource] = useState<ImageSourcePropType | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;

    (async () => {
      setSource(null);
      setFailed(false);

      try {
        const token = await storage.getItem("access_token");
        const absoluteUrl = buildApiUrl(endpoint);
        const authHeaders = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        if (Platform.OS === "web") {
          const response = await fetch(absoluteUrl, {
            headers: authHeaders,
          });
          if (!response.ok) {
            throw new Error(`Image fetch failed: ${response.status}`);
          }
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          if (mounted) {
            setSource({ uri: objectUrl });
          }
          return;
        }

        if (mounted) {
          setSource({ uri: absoluteUrl, headers: authHeaders } as ImageSourcePropType);
        }
      } catch {
        if (mounted) {
          setFailed(true);
        }
      }
    })();

    return () => {
      mounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [endpoint]);

  if (!source) {
    return (
      <View
        className={`${className ?? ""} items-center justify-center bg-slate-100`}
      >
        {failed ? (
          <Text className="text-xs text-slate-500">图片加载失败</Text>
        ) : (
          <ActivityIndicator color="#64748B" />
        )}
      </View>
    );
  }

  return <Image source={source} className={className} resizeMode={resizeMode} />;
}
