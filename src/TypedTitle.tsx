import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily } = loadFont("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

const CYAN = "#00d4ff";
const FULL_TEXT = "PROMPTED";
const CHAR_FRAMES = 10;
const CURSOR_BLINK_FRAMES = 16;
const PROMPT_CHAR = "> ";

const Cursor: React.FC<{
  frame: number;
  visible: boolean;
}> = ({ frame, visible }) => {
  if (!visible) return null;

  const opacity = interpolate(
    frame % CURSOR_BLINK_FRAMES,
    [0, CURSOR_BLINK_FRAMES / 2, CURSOR_BLINK_FRAMES],
    [1, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return <span style={{ opacity, color: CYAN }}>&#x258C;</span>;
};

export const TypedTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // First 15 frames: just the ">" prompt appears with cursor blinking
  const promptVisible = frame >= 0;
  const typingStartFrame = Math.round(0.5 * fps);

  // Typing phase
  const typingFrame = Math.max(0, frame - typingStartFrame);
  const charsTyped = Math.min(
    FULL_TEXT.length,
    Math.floor(typingFrame / CHAR_FRAMES),
  );
  const typedText = FULL_TEXT.slice(0, charsTyped);
  const typingDone = charsTyped >= FULL_TEXT.length;

  // Cursor disappears 2 seconds after typing is done
  const typingEndFrame = typingStartFrame + FULL_TEXT.length * CHAR_FRAMES;
  const cursorVisible = frame < typingEndFrame + 2 * fps;

  // Glow intensity increases as more characters are typed
  const glowProgress = FULL_TEXT.length > 0 ? charsTyped / FULL_TEXT.length : 0;
  const glowBlur = interpolate(glowProgress, [0, 1], [0, 20]);
  const glowOpacity = interpolate(glowProgress, [0, 1], [0.5, 1]);

  // After typing is done, glow pulses gently
  const postTypingFrame = Math.max(0, frame - typingEndFrame);
  const pulseGlow = typingDone
    ? interpolate(
        postTypingFrame % (2 * fps),
        [0, fps, 2 * fps],
        [0, 4, 0],
        { extrapolateRight: "clamp" },
      )
    : 0;

  const totalGlowBlur = glowBlur + pulseGlow;

  // Prompt entrance
  const promptOpacity = promptVisible
    ? interpolate(frame, [0, Math.round(0.3 * fps)], [0, 1], {
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: 90,
          fontWeight: 700,
          color: "white",
          letterSpacing: 6,
          opacity: promptOpacity,
          textShadow: `0 0 ${totalGlowBlur}px ${CYAN}, 0 0 ${totalGlowBlur * 2}px rgba(0, 212, 255, ${glowOpacity * 0.3})`,
          whiteSpace: "pre",
        }}
      >
        <span style={{ color: CYAN }}>{PROMPT_CHAR}</span>
        <span>{typedText}</span>
        <Cursor frame={frame} visible={cursorVisible} />
      </div>
    </div>
  );
};
