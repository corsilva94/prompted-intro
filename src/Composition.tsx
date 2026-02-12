import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import {
  useWindowedAudioData,
  visualizeAudio,
} from "@remotion/media-utils";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { NodeNetwork } from "./NodeNetwork";
import { TypedTitle } from "./TypedTitle";

const { fontFamily } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const CYAN = "#00d4ff";
const AUDIO_SRC = staticFile("Prompted_intro.wav");

// --- Background ---

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        opacity,
        background:
          "radial-gradient(ellipse at 50% 40%, #0d1520 0%, #0a0a14 70%)",
      }}
    />
  );
};

// --- Particles ---

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
  driftX: number;
  driftY: number;
  speed: number;
}

// Seeded deterministic particle positions
const PARTICLES: Particle[] = Array.from({ length: 30 }, (_, i) => {
  const seed = (i * 7919 + 1301) % 10000;
  return {
    x: (seed % 1920),
    y: ((seed * 3) % 1080),
    size: 2 + (seed % 3),
    opacity: 0.15 + (seed % 35) / 100,
    delay: (i % 12) * 3,
    driftX: ((seed % 20) - 10) * 0.5,
    driftY: -15 - (seed % 20),
    speed: 0.3 + (seed % 8) / 10,
  };
});

const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {PARTICLES.map((p, i) => {
        const entrance = spring({
          frame,
          fps,
          config: { damping: 200 },
          delay: Math.round(p.delay * (fps / 10)),
        });

        const time = frame / fps;
        const x = p.x + Math.sin(time * p.speed) * p.driftX;
        const y = p.y + Math.cos(time * p.speed * 0.6) * (p.driftY * 0.1);
        const particleOpacity = entrance * p.opacity;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: CYAN,
              opacity: particleOpacity,
              boxShadow: `0 0 ${p.size * 2}px ${CYAN}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// --- Host Name ---

const HostName: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 15 },
  });

  const translateY = interpolate(entrance, [0, 1], [30, 0]);
  const opacity = interpolate(entrance, [0, 1], [0, 0.7]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 70,
        left: 0,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: 28,
          fontWeight: 400,
          color: "white",
          letterSpacing: 4,
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        with Cory Silva
      </div>
    </div>
  );
};

// --- Audio Reactive Glow ---

const AudioReactiveGlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({
    src: AUDIO_SRC,
    frame,
    fps,
    windowInSeconds: 30,
  });

  if (!audioData) {
    return null;
  }

  const frequencies = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 128,
    optimizeFor: "speed",
    dataOffsetInSeconds,
  });

  // Extract bass frequencies
  const lowFrequencies = frequencies.slice(0, 32);
  const bassIntensity =
    lowFrequencies.reduce((sum, v) => sum + v, 0) / lowFrequencies.length;

  const glowOpacity = Math.min(0.12, bassIntensity * 0.3);
  const glowScale = 1 + bassIntensity * 0.3;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 45%, rgba(0, 212, 255, ${glowOpacity}) 0%, transparent 60%)`,
        transform: `scale(${glowScale})`,
        pointerEvents: "none",
      }}
    />
  );
};

// --- Fade Out ---

const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 2 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a14",
        opacity,
      }}
    />
  );
};

// --- Main Composition ---

export const MyComposition: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* Background gradient */}
      <Background />

      {/* Intro music */}
      <Audio
        src={AUDIO_SRC}
        volume={(f) =>
          interpolate(
            f,
            [0, 0.5 * fps, 13 * fps, 15 * fps],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />

      {/* Circuit node network background */}
      <Sequence premountFor={Math.round(0.5 * fps)}>
        <NodeNetwork />
      </Sequence>

      {/* Floating particles */}
      <Sequence premountFor={Math.round(0.5 * fps)}>
        <Particles />
      </Sequence>

      {/* Terminal typing title - starts at 4s */}
      <Sequence from={Math.round(4 * fps)} premountFor={Math.round(1 * fps)}>
        <TypedTitle />
      </Sequence>

      {/* "with Cory Silva" - starts at 8s */}
      <Sequence from={Math.round(8 * fps)} premountFor={Math.round(1 * fps)}>
        <HostName />
      </Sequence>

      {/* Audio-reactive glow overlay - starts at 8s */}
      <Sequence from={Math.round(8 * fps)} premountFor={Math.round(1 * fps)}>
        <AudioReactiveGlow />
      </Sequence>

      {/* Fade to black - starts at 13s */}
      <Sequence from={Math.round(13 * fps)} premountFor={Math.round(0.5 * fps)}>
        <FadeOut />
      </Sequence>
    </AbsoluteFill>
  );
};
