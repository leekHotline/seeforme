import React from "react";
import { MotiView } from "moti";

interface StaggerItemProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
}

export default function StaggerItem({
  children,
  index = 0,
  className = "",
}: StaggerItemProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 320, delay: index * 70 }}
      className={className}
    >
      {children}
    </MotiView>
  );
}
