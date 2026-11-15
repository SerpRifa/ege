"use client";

import { statusTitle } from "@/config/game";
import type { StatusId, TrackId } from "@/lib/game/types";
import { motion, useReducedMotion } from "motion/react";

export function CharacterPortrait({
  track,
  statusId,
  size = 180,
  animateIdle = false,
}: {
  track: TrackId;
  statusId: StatusId;
  size?: number;
  animateIdle?: boolean;
}) {
  const reduced = useReducedMotion();
  const title = statusTitle(statusId, track);
  const image = (
    <img
      src={`/characters/${track}/${statusId}.svg`}
      alt={title}
      width={size}
      height={size}
      className="h-full w-full object-contain"
    />
  );

  if (!animateIdle || reduced !== false) {
    return (
      <div className="shrink-0" style={{ width: size, height: size }}>
        {image}
      </div>
    );
  }

  return (
    <motion.div
      className="shrink-0"
      style={{ width: size, height: size }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
    >
      {image}
    </motion.div>
  );
}
