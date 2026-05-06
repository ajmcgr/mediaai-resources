import { AbsoluteFill, Sequence } from "remotion";
import { ChatScene } from "./scenes/ChatScene";

export const MainVideo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#f6f8fb" }}>
      <Sequence from={0} durationInFrames={420}>
        <ChatScene />
      </Sequence>
    </AbsoluteFill>
  );
};
