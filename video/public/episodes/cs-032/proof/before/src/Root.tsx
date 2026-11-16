import React from "react";
import { Composition } from "remotion";
import { TitleCard } from "./TitleCard";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TitleCard"
      component={TitleCard}
      durationInFrames={90}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
