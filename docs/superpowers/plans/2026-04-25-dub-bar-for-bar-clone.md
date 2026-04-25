# Dub.co Bar-for-Bar Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port dub.co's entire visual system — semantic design tokens, CSS animations, shared UI primitives, and section layout architecture — verbatim into ClinicPulse.

**Architecture:** Foundation-first: CSS tokens and animation keyframes in globals.css, Satoshi font replacement, shared UI primitive components ported from dub.co, then each landing section rewritten top-to-bottom matching dub.co's exact structure. `motion` library replaces `framer-motion`. `Background` component in page.tsx provides fixed radial gradient mesh behind all content.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, `motion` v12, `@number-flow/react`, TypeScript

---

### Task 1: Add semantic design tokens and CSS animation keyframes to globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add semantic CSS variable tokens**

Replace the `@theme inline` block and `:root` block with dub.co's semantic token system plus ClinicPulse-specific colors retained:

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter);
  --font-display: var(--font-satoshi);

  --color-primary: #0D7A6B;
  --color-primary-foreground: #ffffff;

  --color-status-operational: #22c55e;
  --color-status-degraded: #f59e0b;
  --color-status-non-functional: #ef4444;
  --color-status-unknown: #94a3b8;

  /* Semantic color tokens */
  --color-bg-emphasis: rgb(var(--bg-emphasis, 229 229 229));
  --color-bg-default: rgb(var(--bg-default, 255 255 255));
  --color-bg-subtle: rgb(var(--bg-subtle, 245 245 245));
  --color-bg-muted: rgb(var(--bg-muted, 250 250 250));
  --color-bg-inverted: rgb(var(--bg-inverted, 23 23 23));

  --color-border-emphasis: rgb(var(--border-emphasis, 163 163 163));
  --color-border-default: rgb(var(--border-default, 212 212 212));
  --color-border-muted: rgb(var(--border-muted, 245 245 245));
  --color-border-subtle: rgb(var(--border-subtle, 229 229 229));

  --color-content-inverted: rgb(var(--content-inverted, 255 255 255));
  --color-content-muted: rgb(var(--content-muted, 163 163 163));
  --color-content-subtle: rgb(var(--content-subtle, 115 115 115));
  --color-content-default: rgb(var(--content-default, 64 64 64));
  --color-content-emphasis: rgb(var(--content-emphasis, 23 23 23));

  /* Animation tokens — existing retained */
  --animate-fade-in: fade-in 0.2s ease-out forwards;
  --animate-slide-up-fade: slide-up-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  --animate-slide-down-fade: slide-down-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  --animate-pulse-dot: pulse-dot 2s ease-in-out infinite;
  --animate-ring-pulse: ring-pulse 2s ease-out infinite;
  --animate-float: float 4s linear infinite;
  --animate-pulse-grow: pulse-grow 3s ease-in-out infinite;
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;

  /* Animation tokens — new from dub.co */
  --animate-text-appear: text-appear 0.15s ease;
  --animate-fade-in-blur: fade-in-blur 0.5s ease-out forwards;
  --animate-gradient-move: gradient-move 5s linear infinite;
  --animate-infinite-scroll: infinite-scroll 22s linear infinite;
  --animate-infinite-scroll-y: infinite-scroll-y 22s linear infinite;
  --animate-pulse-scale: pulse-scale 6s ease-out infinite;
  --animate-scale-in-content: scale-in-content 0.2s ease;
  --animate-scale-out-content: scale-out-content 0.2s ease;
  --animate-ellipsis-wave: ellipsis-wave 1.5s ease-in-out infinite;
}

:root {
  --background: #FAFAFA;
  --foreground: #171717;

  --bg-default: 255 255 255;
  --bg-muted: 250 250 250;
  --bg-subtle: 245 245 245;
  --bg-emphasis: 229 229 229;
  --bg-inverted: 23 23 23;

  --border-emphasis: 163 163 163;
  --border-default: 212 212 212;
  --border-muted: 245 245 245;
  --border-subtle: 229 229 229;

  --content-inverted: 255 255 255;
  --content-muted: 163 163 163;
  --content-subtle: 115 115 115;
  --content-default: 64 64 64;
  --content-emphasis: 23 23 23;
}
```

- [ ] **Step 2: Replace existing keyframes with dub.co's full set plus ClinicPulse-specifics**

Replace all existing `@keyframes` blocks with:

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up-fade {
  from { opacity: 0; transform: translateY(var(--offset, 2px)); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-down-fade {
  from { opacity: 0; transform: translateY(var(--offset, -2px)); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes ring-pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}

@keyframes float {
  0% { transform: scale(1) rotate(0) translateX(var(--r, 5%)) rotate(0); }
  50% { transform: scale(1.05) rotate(180deg) translateX(var(--r, 5%)) rotate(-180deg); }
  100% { transform: scale(1) rotate(360deg) translateX(var(--r, 5%)) rotate(-360deg); }
}

@keyframes pulse-grow {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
}

@keyframes text-appear {
  0% { opacity: 0; transform: rotateX(45deg) scale(0.95); }
  100% { opacity: 1; transform: rotateX(0deg) scale(1); }
}

@keyframes fade-in-blur {
  0% { opacity: 0; filter: blur(4px); }
  50% { opacity: 0.5; filter: blur(0px); }
  100% { opacity: 1; filter: blur(0px); }
}

@keyframes gradient-move {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

@keyframes infinite-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(var(--scroll, -150%)); }
}

@keyframes infinite-scroll-y {
  0% { transform: translateY(0); }
  100% { transform: translateY(var(--scroll, -150%)); }
}

@keyframes pulse-scale {
  0% { transform: scale(0.8); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

@keyframes scale-in-content {
  0% { transform: rotateX(-30deg) scale(0.9); opacity: 0; }
  100% { transform: rotateX(0deg) scale(1); opacity: 1; }
}

@keyframes scale-out-content {
  0% { transform: rotateX(0deg) scale(1); opacity: 1; }
  100% { transform: rotateX(-10deg) scale(0.95); opacity: 0; }
}

@keyframes ellipsis-wave {
  0%, 40% { transform: translateY(0); }
  20% { transform: translateY(var(--offset, -10%)); }
}

@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}
```

Keep the existing `html`, `body`, and `.font-display` rules at the bottom:

```css
html {
  scroll-behavior: smooth;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-inter);
}

.font-display {
  font-family: var(--font-satoshi);
}
```

- [ ] **Step 3: Verify CSS compiles**

Run: `npx tailwindcss --input app/globals.css --output /dev/null 2>&1`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: add semantic design tokens and dub.co CSS animation keyframes"
```

---

### Task 2: Replace Playfair Display with Satoshi font

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/fonts/Satoshi-Variable.woff2`

- [ ] **Step 1: Download Satoshi font**

Download from https://api.fontshare.com/v2/css?f%5B%5D=satoshi@1 and extract `Satoshi-Variable.woff2`.

Run:
```bash
curl -L "https://api.fontshare.com/v2/css?f%5B%5D=satoshi@1" > /tmp/satoshi.css
cat /tmp/satoshi.css
```

Or download directly:
```bash
curl -L "https://api.fontshare.com/v2/fonts/download/satoshi" -o /tmp/satoshi.zip
unzip -o /tmp/satoshi.zip "Satoshi-Variable.woff2" -d app/fonts/
```

If the above fails, copy from the already-cloned dub repo:
```bash
cp /tmp/dub-study/apps/web/styles/Satoshi-Variable.woff2 app/fonts/
```

- [ ] **Step 2: Update app/layout.tsx to use Satoshi**

Replace the Playfair_Display import with a local font definition for Satoshi:

```tsx
import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClinicPulse — Real-Time Primary Healthcare Intelligence",
  description:
    "Real-time visibility into South Africa's 3,500+ public primary healthcare clinics. Status tracking, referral routing, and operational intelligence for NGOs, district health managers, and patients.",
  openGraph: {
    title: "ClinicPulse — Know which clinics are working today",
    description:
      "Real-time visibility into South Africa's 3,500+ public primary healthcare clinics.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${satoshi.variable} ${geistMono.variable}`}
    >
      <body className="bg-[#FAFAFA] text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify font loads**

Run: `npm run build 2>&1 | head -20`
Expected: No font-related errors

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/fonts/
git commit -m "feat: replace Playfair Display with Satoshi variable font"
```

---

### Task 3: Create use-scroll, use-scroll-progress, use-resize-observer hooks

**Files:**
- Create: `lib/hooks/use-scroll.ts`
- Create: `lib/hooks/use-scroll-progress.ts`
- Create: `lib/hooks/use-resize-observer.ts`

- [ ] **Step 1: Create use-scroll.ts**

```typescript
import { RefObject, useCallback, useEffect, useState } from "react";

export function useScroll(
  threshold: number,
  { container }: { container?: RefObject<HTMLElement | null> } = {},
) {
  const [scrolled, setScrolled] = useState(false);

  const onScroll = useCallback(() => {
    setScrolled(
      (container?.current ? container.current.scrollTop : window.scrollY) >
        threshold,
    );
  }, [threshold]);

  useEffect(() => {
    const element = container?.current ?? window;
    element.addEventListener("scroll", onScroll);
    return () => element.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  useEffect(() => {
    onScroll();
  }, [onScroll]);

  return scrolled;
}
```

- [ ] **Step 2: Create use-resize-observer.ts**

```typescript
import { RefObject, useEffect, useState } from "react";

export function useResizeObserver(
  elementRef: RefObject<Element | null>,
): ResizeObserverEntry | undefined {
  const [entry, setEntry] = useState<ResizeObserverEntry>();

  const updateEntry = ([entry]: ResizeObserverEntry[]): void => {
    setEntry(entry);
  };

  useEffect(() => {
    const node = elementRef?.current;
    if (!node) return;

    const observer = new ResizeObserver(updateEntry);
    observer.observe(node);
    return () => observer.disconnect();
  }, [elementRef]);

  return entry;
}
```

- [ ] **Step 3: Create use-scroll-progress.ts**

```typescript
"use client";

import { RefObject, useCallback, useEffect, useState } from "react";
import { useResizeObserver } from "./use-resize-observer";

export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  { direction = "vertical" }: { direction?: "vertical" | "horizontal" } = {},
) {
  const [scrollProgress, setScrollProgress] = useState(1);

  const updateScrollProgress = useCallback(() => {
    if (!ref.current) return;
    const scroll =
      direction === "vertical" ? ref.current.scrollTop : ref.current.scrollLeft;
    const scrollSize =
      direction === "vertical"
        ? ref.current.scrollHeight
        : ref.current.scrollWidth;
    const clientSize =
      direction === "vertical"
        ? ref.current.clientHeight
        : ref.current.clientWidth;

    setScrollProgress(
      scrollSize === clientSize
        ? 1
        : Math.min(scroll / (scrollSize - clientSize), 1),
    );
  }, [direction]);

  const resizeObserverEntry = useResizeObserver(ref);

  useEffect(updateScrollProgress, [resizeObserverEntry]);

  return { scrollProgress, updateScrollProgress };
}
```

- [ ] **Step 4: Commit**

```bash
mkdir -p lib/hooks
git add lib/hooks/
git commit -m "feat: add use-scroll, use-scroll-progress, use-resize-observer hooks"
```

---

### Task 4: Create MaxWidthWrapper component

**Files:**
- Create: `components/ui/max-width-wrapper.tsx`

- [ ] **Step 1: Write component**

```tsx
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function MaxWidthWrapper({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("mx-auto w-full max-w-screen-xl px-3 lg:px-10", className)}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/max-width-wrapper.tsx
git commit -m "feat: add MaxWidthWrapper component (ported from dub.co)"
```

---

### Task 5: Create ProgressiveBlur component

**Files:**
- Create: `components/ui/progressive-blur.tsx`

- [ ] **Step 1: Write component**

```tsx
import { cn } from "@/lib/utils";
import React from "react";

type Side = "left" | "right" | "top" | "bottom";

const oppositeSide: Record<Side, Side> = {
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top",
};

const black = "rgba(0, 0, 0, 1)";
const transparent = "rgba(0, 0, 0, 0)";

export function ProgressiveBlur({
  strength = 32,
  steps = 4,
  side = "top",
  className,
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  strength?: number;
  steps?: number;
  falloffPercentage?: number;
  side?: Side;
}) {
  const step = 100 / steps;
  const factor = 0.5;
  const base = Math.pow(strength / factor, 1 / (steps - 1));

  const getBackdropFilter = (i: number) =>
    `blur(${factor * base ** (steps - i - 1)}px)`;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        transformOrigin: side,
        ...style,
      }}
      {...rest}
    >
      <div
        className="relative z-0 size-full"
        style={{
          background: `linear-gradient(
            to ${oppositeSide[side]},
            rgb(from transparent r g b / alpha) 0%,
            rgb(from transparent r g b / 0%) 100%
          )`,
        }}
      >
        <div
          className="z-1 absolute inset-0"
          style={{
            mask: `linear-gradient(
                  to ${oppositeSide[side]},
                  ${black} 0%,
                  ${transparent} ${step}%
                )`,
            backdropFilter: getBackdropFilter(0),
            WebkitBackdropFilter: getBackdropFilter(0),
          }}
        />

        {steps > 1 && (
          <div
            className="absolute inset-0 z-[2]"
            style={{
              mask: `linear-gradient(
                to ${oppositeSide[side]},
                  ${black} 0%,
                  ${black} ${step}%,
                  ${transparent} ${step * 2}%
                )`,
              backdropFilter: getBackdropFilter(1),
              WebkitBackdropFilter: getBackdropFilter(1),
            }}
          />
        )}

        {steps > 2 &&
          [...Array(steps - 2)].map((_, idx) => (
            <div
              key={idx}
              className="absolute inset-0"
              style={{
                zIndex: idx + 2,
                mask: `linear-gradient(
                    to ${oppositeSide[side]},
                    ${transparent} ${idx * step}%,
                    ${black} ${(idx + 1) * step}%,
                    ${black} ${(idx + 2) * step}%,
                    ${transparent} ${(idx + 3) * step}%
                  )`,
                backdropFilter: getBackdropFilter(idx + 2),
                WebkitBackdropFilter: getBackdropFilter(idx + 2),
              }}
            />
          ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/progressive-blur.tsx
git commit -m "feat: add ProgressiveBlur component (ported from dub.co)"
```

---

### Task 6: Create DotsPattern component

**Files:**
- Create: `components/ui/dots-pattern.tsx`

- [ ] **Step 1: Write component**

```tsx
import { cn } from "@/lib/utils";
import { useId } from "react";

export function DotsPattern({
  dotSize = 2,
  gapSize = 10,
  patternOffset = [0, 0],
  className,
}: {
  dotSize?: number;
  gapSize?: number;
  patternOffset?: [number, number];
  className?: string;
}) {
  const id = useId();

  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 text-black/10",
        className,
      )}
      width="100%"
      height="100%"
    >
      <defs>
        <pattern
          id={`dots-${id}`}
          x={patternOffset[0] - 1}
          y={patternOffset[1] - 1}
          width={dotSize + gapSize}
          height={dotSize + gapSize}
          patternUnits="userSpaceOnUse"
        >
          <rect
            x={1}
            y={1}
            width={dotSize}
            height={dotSize}
            fill="currentColor"
          />
        </pattern>
      </defs>
      <rect fill={`url(#dots-${id})`} width="100%" height="100%" />
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/dots-pattern.tsx
git commit -m "feat: add DotsPattern component (ported from dub.co)"
```

---

### Task 7: Create ShimmerDots component

**Files:**
- Create: `components/ui/shimmer-dots.tsx`

- [ ] **Step 1: Write component**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const vertexShader = `
attribute vec2 position;

void main() 
{
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform float dotSize;
uniform float cellSize;
uniform float speed;
uniform vec3 color;

float PHI = 1.61803398874989484820459; 
float random(in vec2 xy){
    return fract(tan(distance(xy*PHI, xy))*xy.x);
}

void main(void) {
  vec2 uv = gl_FragCoord.xy;

  vec2 cellUv = vec2(int(uv.x / cellSize), int(uv.y / cellSize));
  float id = random(cellUv + 1.0);

  float fadeEffect = (sin(time * speed + id * 20.0) + 1.0) * 0.5;
  
  vec2 dotUv = fract(uv / cellSize);
  float dot = step(max(dotUv.x, dotUv.y), dotSize / cellSize);

  float opacity = dot * fadeEffect;

  vec4 fragColor = vec4(color, opacity);
  fragColor.rgb *= fragColor.a;

  gl_FragColor = fragColor;
}
`;

const TARGET_FPS = 60;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

export function ShimmerDots({
  dotSize = 1,
  cellSize = 3,
  speed = 5,
  color = [0, 0, 0],
  className,
}: {
  dotSize?: number;
  cellSize?: number;
  speed?: number;
  color?: [number, number, number];
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const parent = canvas.parentElement;
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = parent.clientWidth * devicePixelRatio;
    canvas.height = parent.clientHeight * devicePixelRatio;

    const gl = canvas.getContext("webgl", {
      powerPreference: "low-power",
      depth: false,
      stencil: false,
    });

    if (gl === null) {
      console.error("Failed to initialize WebGL");
      return;
    }

    const shaderProgram = gl.createProgram();
    if (!shaderProgram) {
      console.error("Failed to create shader program");
      return;
    }

    for (let i = 0; i < 2; ++i) {
      const source = i === 0 ? vertexShader : fragmentShader;
      const shaderObj = gl.createShader(
        i === 0 ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER,
      );
      if (!shaderObj) {
        console.error("Failed to create shader");
        return;
      }
      gl.shaderSource(shaderObj, source);
      gl.compileShader(shaderObj);
      if (!gl.getShaderParameter(shaderObj, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(shaderObj));
      gl.attachShader(shaderProgram, shaderObj);
      gl.linkProgram(shaderProgram);
    }

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
      console.error(gl.getProgramInfoLog(shaderProgram));

    const position = gl.getAttribLocation(shaderProgram, "position");
    const time = gl.getUniformLocation(shaderProgram, "time");
    const resolution = gl.getUniformLocation(shaderProgram, "resolution");
    const dotSizeUniform = gl.getUniformLocation(shaderProgram, "dotSize");
    const cellSizeUniform = gl.getUniformLocation(shaderProgram, "cellSize");
    const speedUniform = gl.getUniformLocation(shaderProgram, "speed");
    const colorUniform = gl.getUniformLocation(shaderProgram, "color");

    gl.useProgram(shaderProgram);

    const pos = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1f(dotSizeUniform, dotSize * window.devicePixelRatio);
    gl.uniform1f(cellSizeUniform, cellSize * window.devicePixelRatio);
    gl.uniform1f(speedUniform, speed);
    gl.uniform3f(colorUniform, color[0], color[1], color[2]);

    let animationFrameId: number;
    let lastTimestamp = 0;

    function render(timestamp: number) {
      if (timestamp - lastTimestamp < FRAME_INTERVAL) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      lastTimestamp = timestamp;

      if (gl && canvas && shaderProgram) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform1f(time, timestamp / 1000.0);
        gl.uniform2f(resolution, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      setContextLost(true);
      cancelAnimationFrame(animationFrameId);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("webglcontextlost", () => {});
    };
  }, [dotSize, cellSize, speed]);

  return (
    <div
      className={cn("absolute inset-0", className, contextLost && "opacity-0")}
    >
      <canvas
        ref={canvasRef}
        width="100%"
        height="100%"
        className="size-full"
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/shimmer-dots.tsx
git commit -m "feat: add ShimmerDots WebGL component (ported from dub.co)"
```

---

### Task 8: Create Background component

**Files:**
- Create: `components/ui/background.tsx`

- [ ] **Step 1: Write component**

```tsx
export function Background() {
  return (
    <div style={styles.backgroundMain}>
      <div style={styles.backgroundMainBefore} />
      <div style={styles.backgroundMainAfter} />
      <div style={styles.backgroundContent} />
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  backgroundMain: {
    width: "100vw",
    minHeight: "100vh",
    position: "fixed",
    zIndex: 1,
    display: "flex",
    justifyContent: "center",
    padding: "120px 24px 160px 24px",
    pointerEvents: "none",
  },
  backgroundMainBefore: {
    background: "radial-gradient(circle, rgba(2, 0, 36, 0) 0, #fafafa 100%)",
    position: "absolute",
    content: '""',
    zIndex: 2,
    width: "100%",
    height: "100%",
    top: 0,
  },
  backgroundMainAfter: {
    content: '""',
    backgroundImage: "url(https://assets.dub.co/misc/grid.svg)",
    zIndex: 1,
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    opacity: 0.4,
    filter: "invert(1)",
  },
  backgroundContent: {
    zIndex: 3,
    width: "100%",
    maxWidth: "640px",
    backgroundImage: `radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 1) 0px, transparent 0%), 
                      radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 1) 0px, transparent 50%),
                      radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 1) 0px, transparent 50%),
                      radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 1) 0px, transparent 50%),
                      radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 1) 0px, transparent 50%),
                      radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 1) 0px, transparent 50%),
                      radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 1) 0px, transparent 50%)`,
    position: "absolute",
    height: "100%",
    filter: "blur(100px) saturate(150%)",
    top: "80px",
    opacity: 0.15,
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/background.tsx
git commit -m "feat: add Background component with radial gradient mesh (ported from dub.co)"
```

---

### Task 9: Create BlurImage, AnimatedSizeContainer, ScrollContainer components

**Files:**
- Create: `components/ui/blur-image.tsx`
- Create: `components/ui/animated-size-container.tsx`
- Create: `components/ui/scroll-container.tsx`

- [ ] **Step 1: Write BlurImage**

```tsx
"use client";

import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";
import { memo, useEffect, useState } from "react";

export const BlurImage = memo((props: ImageProps) => {
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState(props.src);
  useEffect(() => setSrc(props.src), [props.src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setLoading(false);
    const target = e.target as HTMLImageElement;
    if (target.naturalWidth <= 16 && target.naturalHeight <= 16) {
      setSrc(`https://avatar.vercel.sh/${encodeURIComponent(props.alt)}`);
    }
  };

  return (
    <Image
      {...props}
      src={src}
      alt={props.alt}
      className={cn(loading ? "blur-[2px]" : "blur-0", props.className)}
      onLoad={handleLoad}
      onError={() => {
        setSrc(`https://avatar.vercel.sh/${encodeURIComponent(props.alt)}`);
      }}
      unoptimized
    />
  );
});

BlurImage.displayName = "BlurImage";
```

- [ ] **Step 2: Write AnimatedSizeContainer**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
  ComponentPropsWithoutRef,
  ForwardRefExoticComponent,
  PropsWithChildren,
  RefAttributes,
  forwardRef,
  useRef,
} from "react";
import { useResizeObserver } from "@/lib/hooks/use-resize-observer";

const defaultTransition = { type: "spring" as const, duration: 0.3 };

type AnimatedSizeContainerProps = PropsWithChildren<{
  width?: boolean;
  height?: boolean;
}> &
  Omit<ComponentPropsWithoutRef<typeof motion.div>, "animate" | "children">;

const AnimatedSizeContainer: ForwardRefExoticComponent<
  AnimatedSizeContainerProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, AnimatedSizeContainerProps>(
  (
    {
      width = false,
      height = false,
      className,
      transition,
      children,
      ...rest
    }: AnimatedSizeContainerProps,
    forwardedRef,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const resizeObserverEntry = useResizeObserver(containerRef);
    const hasMeasuredRef = useRef(false);

    const measuredWidth = resizeObserverEntry?.contentRect?.width;
    const measuredHeight = resizeObserverEntry?.contentRect?.height;
    const isFirstMeasurement =
      (width ? measuredWidth != null : true) &&
      (height ? measuredHeight != null : true) &&
      !hasMeasuredRef.current;

    if (resizeObserverEntry) {
      hasMeasuredRef.current = true;
    }

    const effectiveTransition =
      transition ?? (isFirstMeasurement ? { duration: 0 } : defaultTransition);

    return (
      <motion.div
        ref={forwardedRef}
        className={cn("overflow-hidden", className)}
        animate={{
          width: width ? measuredWidth ?? "auto" : "auto",
          height: height ? measuredHeight ?? "auto" : "auto",
        }}
        transition={effectiveTransition}
        {...rest}
      >
        <div
          ref={containerRef}
          className={cn(height && "h-max", width && "w-max")}
        >
          {children}
        </div>
      </motion.div>
    );
  },
);

AnimatedSizeContainer.displayName = "AnimatedSizeContainer";

export { AnimatedSizeContainer };
```

- [ ] **Step 3: Write ScrollContainer**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { PropsWithChildren, useRef } from "react";
import { useScrollProgress } from "@/lib/hooks/use-scroll-progress";

export function ScrollContainer({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollProgress, updateScrollProgress } = useScrollProgress(ref);

  return (
    <div className="relative">
      <div
        className={cn(
          "h-full w-screen overflow-y-scroll [clip-path:inset(0)] sm:w-auto",
          className,
        )}
        ref={ref}
        onScroll={updateScrollProgress}
      >
        {children}
      </div>
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-10 hidden h-16 w-full rounded-b-lg bg-gradient-to-t from-white to-transparent sm:block"
        style={{ opacity: 1 - Math.pow(scrollProgress, 2) }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/blur-image.tsx components/ui/animated-size-container.tsx components/ui/scroll-container.tsx
git commit -m "feat: add BlurImage, AnimatedSizeContainer, ScrollContainer (ported from dub.co)"
```

---

### Task 10: Upgrade framer-motion to motion

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove framer-motion and install motion**

```bash
npm uninstall framer-motion && npm install motion@^12.0.0
```

- [ ] **Step 2: Update all imports from "framer-motion" to "motion/react"**

Files that import from framer-motion (search first, then update):

Run search:
```bash
grep -rn "from \"framer-motion\"" --include="*.tsx" --include="*.ts" | head -20
```

Update these files (use replaceAll "from \"framer-motion\"" → "from \"motion/react\"" for each file found):

- `components/landing/hero.tsx`
- `components/landing/demo-card.tsx`
- `components/landing/problem-section.tsx`
- `components/landing/interface-showcase.tsx`
- `components/landing/features-section.tsx`
- `components/landing/social-proof.tsx`
- `components/landing/cta-section.tsx`
- `components/landing/animated-counter.tsx`
- All files in `components/landing/graphics/`

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -10
```
Expected: No framer-motion import errors

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git add $(grep -rl "from \"motion/react\"" --include="*.tsx" --include="*.ts")
git commit -m "feat: upgrade framer-motion to motion v12"
```

---

### Task 11: Rewrite navigation component

**Files:**
- Modify: `components/landing/nav.tsx`
- Modify: `components/landing/button-link.tsx`

- [ ] **Step 1: Rewrite nav.tsx with scroll-aware backdrop-blur**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { useScroll } from "@/lib/hooks/use-scroll";
import Link from "next/link";

const NAV_ITEMS = [
  { name: "Product", href: "#product" },
  { name: "Interfaces", href: "#interfaces" },
  { name: "Proof", href: "#proof" },
];

export function Nav() {
  const scrolled = useScroll(40);

  return (
    <div
      className={cn(
        "sticky inset-x-0 top-0 z-30 w-full transition-all",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 block border-b border-transparent transition-all",
          scrolled &&
            "border-neutral-200/80 bg-white/75 backdrop-blur-lg",
        )}
      />
      <div className="relative mx-auto w-full max-w-screen-xl px-3 lg:px-10">
        <div className="flex h-14 items-center justify-between">
          <div className="grow basis-0">
            <Link href="/" className="block w-fit py-2 pr-2">
              <span className="text-[15px] font-semibold tracking-tight text-neutral-900">
                ClinicPulse
              </span>
            </Link>
          </div>

          <div className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map(({ name, href }) => (
              <Link
                key={name}
                href={href}
                className="relative flex items-center rounded-md px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-900/5 hover:text-neutral-900"
              >
                {name}
              </Link>
            ))}
          </div>

          <div className="hidden grow basis-0 justify-end gap-2 lg:flex">
            <Link
              href="/login"
              className="flex h-8 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
            >
              Sign in
            </Link>
            <Link
              href="/demo"
              className="flex h-8 items-center rounded-lg border border-neutral-900 bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              Request Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update button-link.tsx to match dub.co's button styles (h-8)**

```tsx
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ComponentProps } from "react";

export function ButtonLink({
  variant = "primary",
  className,
  href,
  children,
  ...rest
}: {
  variant?: "primary" | "secondary";
  href: string;
} & ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-8 w-fit items-center whitespace-nowrap rounded-lg border px-4 text-sm font-medium transition-all",
        variant === "primary" &&
          "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800 hover:ring-4 hover:ring-neutral-200",
        variant === "secondary" &&
          "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 hover:border-neutral-400",
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/landing/nav.tsx components/landing/button-link.tsx
git commit -m "feat: rewrite nav with scroll-aware backdrop-blur and dub.co button styles"
```

---

### Task 12: Rewrite hero section (product-led)

**Files:**
- Modify: `components/landing/hero.tsx`

- [ ] **Step 1: Write the product-led hero with console card, map dots, live report stream, floating alert card**

```tsx
"use client";

import { motion } from "motion/react";
import { Grid } from "@/components/ui/grid";
import { DotsPattern } from "@/components/ui/dots-pattern";
import { ShimmerDots } from "@/components/ui/shimmer-dots";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { ButtonLink } from "./button-link";

const mapDots = [
  { left: "32%", top: "20%", status: "operational" },
  { left: "40%", top: "26%", status: "operational" },
  { left: "52%", top: "22%", status: "operational" },
  { left: "44%", top: "34%", status: "operational" },
  { left: "58%", top: "28%", status: "degraded" },
  { left: "36%", top: "42%", status: "operational" },
  { left: "48%", top: "38%", status: "operational" },
  { left: "62%", top: "36%", status: "operational" },
  { left: "42%", top: "48%", status: "non-functional" },
  { left: "53%", top: "44%", status: "operational" },
  { left: "34%", top: "56%", status: "operational" },
  { left: "46%", top: "52%", status: "degraded" },
  { left: "56%", top: "58%", status: "operational" },
  { left: "40%", top: "64%", status: "operational" },
  { left: "50%", top: "70%", status: "operational" },
  { left: "60%", top: "50%", status: "operational" },
  { left: "38%", top: "74%", status: "unknown" },
  { left: "48%", top: "80%", status: "operational" },
  { left: "55%", top: "45%", status: "operational" },
  { left: "30%", top: "38%", status: "operational" },
] as const;

const alerts = [
  {
    clinic: "Alexandra PHC",
    status: "Non-Functional",
    time: "2m ago",
    detail: "Stockout — ARV medication",
  },
  {
    clinic: "Mamelodi Clinic",
    status: "Degraded",
    time: "8m ago",
    detail: "Staff shortage — 2/5 nurses",
  },
];

const reportStream = [
  { clinic: "Diepsloot CHC", status: "Operational", time: "Just now" },
  { clinic: "Soshanguve CHC", status: "Operational", time: "1m ago" },
  { clinic: "Alexandra PHC", status: "Non-Functional", time: "2m ago" },
  { clinic: "Mamelodi Clinic", status: "Degraded", time: "8m ago" },
  { clinic: "Tembisa CHC", status: "Operational", time: "12m ago" },
  { clinic: "Katlehong Clinic", status: "Operational", time: "15m ago" },
];

const statusColors: Record<string, string> = {
  operational: "bg-green-500",
  degraded: "bg-amber-500",
  "non-functional": "bg-red-500",
  unknown: "bg-slate-400",
};

const statusTextColors: Record<string, string> = {
  Operational: "text-green-600",
  Degraded: "text-amber-600",
  "Non-Functional": "text-red-600",
};

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pb-32 sm:pt-40 lg:px-8">
      <Grid
        cellSize={80}
        patternOffset={[1, -58]}
        className="inset-[unset] left-1/2 top-0 w-[1200px] -translate-x-1/2 text-neutral-200/60 [mask-image:linear-gradient(transparent,black_70%)]"
      />
      <DotsPattern
        dotSize={1}
        gapSize={8}
        className="text-neutral-300/40 [mask-image:radial-gradient(closest-side,black,transparent)]"
      />
      <ShimmerDots
        dotSize={1}
        cellSize={2}
        speed={3}
        color={[0.05, 0.2, 0.1]}
        className="opacity-30 [mask-image:radial-gradient(closest-side,black,transparent)]"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </span>
            Live — 3,500+ clinics monitored across 52 districts
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-[800px] font-display text-4xl font-medium leading-[1.1] tracking-tight text-neutral-900 sm:text-5xl lg:text-[56px]"
          style={{ textWrap: "balance" }}
        >
          A live operating layer for{" "}
          <span className="bg-gradient-to-r from-[#0D7A6B] via-[#0FA89A] to-[#22c55e] bg-[length:200%_auto] animate-gradient-move bg-clip-text text-transparent">
            primary healthcare.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          className="mx-auto mt-6 max-w-[540px] text-base leading-relaxed text-neutral-500 sm:text-lg"
        >
          Know which clinics are open, overloaded, out of stock, or ready to
          receive patients — before anyone starts travelling.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          className="mt-8 flex items-center justify-center gap-2.5"
        >
          <ButtonLink href="/demo" variant="primary">
            Request Demo
            <svg
              className="ml-1 size-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </ButtonLink>
          <ButtonLink href="#product" variant="secondary">
            Watch Live Flow
          </ButtonLink>
        </motion.div>
      </div>

      {/* Product Console Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
        className="relative mx-auto mt-16 max-w-[1000px]"
      >
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
          {/* Window chrome */}
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full border border-neutral-300" />
              <div className="h-2.5 w-2.5 rounded-full border border-neutral-300" />
              <div className="h-2.5 w-2.5 rounded-full border border-neutral-300" />
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              <span className="text-[11px] font-medium text-green-600">
                Live
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 tabular-nums">
              District Console · Gauteng Province
            </span>
          </div>

          <div className="grid min-h-[300px] grid-cols-1 md:grid-cols-3">
            {/* Map panel */}
            <div className="relative flex flex-col border-b border-neutral-100 p-4 md:border-b-0 md:border-r md:p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Clinic Status Map
              </div>
              <div className="relative flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />
                {mapDots.map((dot, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8 + Math.random() * 0.4, duration: 0.3 }}
                    className={`absolute rounded-full ${statusColors[dot.status]} ${
                      i === 4 || i === 8 ? "h-2.5 w-2.5" : "h-1.5 w-1.5"
                    }`}
                    style={{ left: dot.left, top: dot.top }}
                  >
                    {(i === 4 || i === 8) && (
                      <span className="absolute inset-[-4px] animate-ring-pulse rounded-full border-[1.5px] border-green-400/40" />
                    )}
                  </motion.span>
                ))}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="absolute bottom-2 left-2 right-2 flex justify-between text-[9px] font-medium text-neutral-400"
                >
                  <span>254 active in view</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Operational
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Report stream */}
            <div className="flex flex-col border-b border-neutral-100 p-4 md:border-b-0 md:border-r md:p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Live Report Stream
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="animate-infinite-scroll-y space-y-1.5" style={{ "--scroll": "-100%" } as React.CSSProperties}>
                  {[...reportStream, ...reportStream].map((report, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-md border border-neutral-100 bg-white px-2.5 py-1.5"
                    >
                      <div>
                        <div className="text-[12px] font-medium text-neutral-800">
                          {report.clinic}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {report.time}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-medium ${statusTextColors[report.status as keyof typeof statusTextColors]}`}
                      >
                        {report.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alerts panel */}
            <div className="flex flex-col p-4 md:p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Active Alerts
              </div>
              <div className="flex flex-col gap-2.5">
                {alerts.map((alert, i) => (
                  <motion.div
                    key={alert.clinic}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.15 }}
                    className="rounded-lg border border-red-100 bg-red-50/50 p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-neutral-900">
                        {alert.clinic}
                      </span>
                      <span className="text-[10px] font-medium text-red-600">
                        {alert.status}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-500">
                      {alert.detail}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400">
                        {alert.time}
                      </span>
                      <span className="text-[10px] font-medium text-[#0D7A6B] cursor-pointer hover:underline">
                        Reroute patients →
                      </span>
                    </div>
                  </motion.div>
                ))}

                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
                  <div className="text-[12px] font-medium text-neutral-800">
                    District Health Score
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
                      <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400" />
                    </div>
                    <span className="text-[12px] font-semibold text-neutral-700">
                      78%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom counter bar */}
          <div className="grid grid-cols-2 border-t border-neutral-200 sm:grid-cols-4">
            {[
              { value: "2,847", label: "Operational", color: "text-green-700" },
              { value: "287", label: "Degraded", color: "text-amber-700" },
              { value: "107", label: "Non-Functional", color: "text-red-700" },
              { value: "259", label: "Unknown", color: "text-slate-600" },
            ].map((counter, i) => (
              <motion.div
                key={counter.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + i * 0.1 }}
                className="border-b border-neutral-100 border-r px-5 py-3 text-center last:border-r-0 sm:border-b-0"
              >
                <div className={`text-lg font-semibold tabular-nums tracking-tight sm:text-xl ${counter.color}`}>
                  {counter.value}
                </div>
                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-400 sm:text-[11px]">
                  {counter.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <ProgressiveBlur
        className="absolute bottom-0 left-0 right-0 h-48"
        side="top"
        strength={20}
        steps={4}
      />
    </section>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -10
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/landing/hero.tsx
git commit -m "feat: rewrite hero with product-led console card, map, alerts, report stream"
```

---

### Task 13: Create TrustStrip component

**Files:**
- Create: `components/landing/trust-strip.tsx`

- [ ] **Step 1: Write component**

```tsx
"use client";

import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { motion } from "motion/react";

const marks = [
  "District Health Teams",
  "NGO Networks",
  "CHW Teams",
  "NHI Readiness",
  "Open Data",
  "Field Operations",
];

export function TrustStrip() {
  return (
    <section className="border-t border-neutral-200">
      <MaxWidthWrapper className="py-10">
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
          <div className="flex animate-infinite-scroll gap-16" style={{ "--scroll": "-50%" } as React.CSSProperties}>
            {[...marks, ...marks, ...marks].map((mark, i) => (
              <div key={i} className="flex shrink-0 items-center gap-2.5 text-sm font-medium text-neutral-400">
                <div className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                {mark}
              </div>
            ))}
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-6 text-center text-sm text-neutral-400"
        >
          Built for district managers, NGOs, community health workers, and public
          clinic finders.
        </motion.p>
      </MaxWidthWrapper>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/trust-strip.tsx
git commit -m "feat: add TrustStrip with infinite-scroll marquee"
```

---

### Task 14: Create Manifesto component (replaces ProblemSection)

**Files:**
- Create: `components/landing/manifesto.tsx`

- [ ] **Step 1: Write component**

```tsx
"use client";

import { motion } from "motion/react";
import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { StatusBadge } from "./status-badge";

const reportRows = [
  { clinic: "Mamelodi Clinic", status: "degraded" as const, time: "2m ago" },
  { clinic: "Soweto CHC", status: "operational" as const, time: "5m ago" },
  { clinic: "Alexandra PHC", status: "non-functional" as const, time: "8m ago" },
  { clinic: "Tembisa CHC", status: "operational" as const, time: "12m ago" },
  { clinic: "Diepsloot CHC", status: "operational" as const, time: "15m ago" },
];

export function Manifesto() {
  return (
    <section className="border-t border-neutral-200 bg-white">
      <MaxWidthWrapper className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
              The Problem
            </p>
            <h2 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl" style={{ textWrap: "balance" }}>
              Healthcare access is not just about facilities. It is about what is
              working today.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-neutral-500">
              On any given day, hundreds of South Africa&apos;s 3,500+ public
              clinics are understaffed, out of stock, or overwhelmed. The data
              exists — in DHIS2, in field reports, in WhatsApp groups — but it
              is spread across systems that were never designed to talk to each
              other.
            </p>
            <p className="mt-4 text-base leading-relaxed text-neutral-500">
              ClinicPulse connects these disconnected signals into a single
              operating layer. So district managers can redirect patients before
              they travel. So field workers can report from anywhere, even
              offline. So every clinic visit starts with knowing what&apos;s
              actually available.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col gap-3"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Live Clinic Reports
            </p>
            <div className="flex flex-col gap-2">
              {reportRows.map((row, i) => (
                <motion.div
                  key={row.clinic}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5"
                >
                  <div>
                    <div className="text-sm font-medium text-neutral-900">
                      {row.clinic}
                    </div>
                    <div className="text-xs text-neutral-400">{row.time}</div>
                  </div>
                  <StatusBadge status={row.status} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/manifesto.tsx
git commit -m "feat: add Manifesto section replacing ProblemSection"
```

---

### Task 15: Create ProductModules component

**Files:**
- Create: `components/landing/product-modules.tsx`

- [ ] **Step 1: Write component**

```tsx
"use client";

import { motion } from "motion/react";
import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import Link from "next/link";
import { StatusMapGraphic } from "./graphics/status-map";
import { FieldReportsGraphic } from "./graphics/field-reports";
import { AnalyticsGraphic } from "./graphics/analytics";

const modules = [
  {
    label: "Product",
    title: "See every clinic in real time",
    description:
      "Interactive map with live status across all 52 districts. Click markers, filter by status, and see operational capacity at a glance.",
    href: "/platform",
    linkText: "Explore District Console",
    graphic: <StatusMapGraphic />,
  },
  {
    label: "Product",
    title: "Report from anywhere, even offline",
    description:
      "5-field quick report forms that work without internet. Submits optimistically, queues locally, syncs automatically.",
    href: "/features",
    linkText: "Explore Field Reports",
    graphic: <FieldReportsGraphic />,
  },
  {
    label: "Product",
    title: "Route patients to working clinics",
    description:
      "Lightweight clinic finder for patients. Search by suburb, see status badges, get directions. Loads in under 2 seconds on 3G.",
    href: "/features",
    linkText: "Explore Clinic Finder",
    graphic: <AnalyticsGraphic />,
  },
];

export function ProductModules() {
  return (
    <section className="border-t border-neutral-200 bg-white">
      <MaxWidthWrapper className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-3">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="group relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-neutral-300"
            >
              <div className="mb-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
                  {mod.label}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">
                {mod.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                {mod.description}
              </p>
              <div className="relative mt-5 h-44 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                {mod.graphic}
              </div>
              <Link
                href={mod.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-neutral-600 transition-colors hover:text-[#0D7A6B]"
              >
                {mod.linkText}
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/product-modules.tsx
git commit -m "feat: add ProductModules section with 3 product cards"
```

---

### Task 16: Rewrite FeaturesSection as infrastructure deep-dive

**Files:**
- Modify: `components/landing/features-section.tsx`

- [ ] **Step 1: Write rewritten component**

```tsx
"use client";

import { motion } from "motion/react";
import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { Grid } from "@/components/ui/grid";
import Link from "next/link";

const capabilities = [
  {
    title: "Clinic Status API",
    description:
      "REST endpoint returning real-time status for any clinic by ID. Sub-100ms response, cached at edge.",
    href: "#",
    artifact: (
      <div className="rounded-md bg-neutral-900 p-2.5 font-mono text-[10px] text-green-400 leading-relaxed">
        <span className="text-blue-400">GET</span> /v1/clinics/{`{id}`}
        {"\n"}
        <span className="text-neutral-500">{`{`}</span>
        {"\n  "}<span className="text-amber-300">&quot;status&quot;</span>: <span className="text-green-300">&quot;operational&quot;</span>,
        {"\n  "}<span className="text-amber-300">&quot;staff&quot;</span>: <span className="text-purple-300">5</span>,
        {"\n  "}<span className="text-amber-300">&quot;stock&quot;</span>: <span className="text-purple-300">92</span>%
        {"\n"}<span className="text-neutral-500">{`}`}</span>
      </div>
    ),
  },
  {
    title: "Offline Sync Queue",
    description:
      "Reports queue locally in IndexedDB when offline. Auto-syncs with exponential backoff when connectivity returns.",
    href: "#",
    artifact: (
      <div className="flex items-center gap-3 rounded-md bg-neutral-50 px-2.5 py-2 ring-1 ring-neutral-200">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-100 text-[10px] font-bold text-amber-700">3</div>
        <div className="flex-1">
          <div className="text-[11px] font-medium text-neutral-700">Reports queued</div>
          <div className="h-1 mt-1 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full w-[65%] rounded-full bg-amber-400 animate-pulse" />
          </div>
        </div>
        <span className="text-[10px] text-neutral-400">Syncing...</span>
      </div>
    ),
  },
  {
    title: "Capacity Scoring",
    description:
      "Machine learning model predicts clinic load based on staff levels, stock data, time of day, and historical patterns.",
    href: "#",
    artifact: (
      <div className="flex items-center gap-2 rounded-md bg-neutral-50 px-2.5 py-2 ring-1 ring-neutral-200">
        <div className="text-[11px] font-medium text-neutral-600">Diepsloot CHC</div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400" />
          </div>
          <span className="text-[11px] font-semibold text-neutral-700">78%</span>
        </div>
      </div>
    ),
  },
  {
    title: "Routing Engine",
    description:
      "Patient referral logic: find nearest operational clinic by status, distance, and capacity. Integrates with Google Maps.",
    href: "#",
    artifact: (
      <div className="space-y-1 rounded-md bg-neutral-50 px-2.5 py-2 ring-1 ring-neutral-200">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-neutral-500">Patient: Sandton</span>
          <span className="text-green-600">Routed → Soweto CHC</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-neutral-400">
          <span>Clinic A: degraded (8.2km)</span>
          <span>→</span>
          <span className="font-medium text-green-600">Clinic B: operational (3.1km)</span>
        </div>
      </div>
    ),
  },
  {
    title: "Field Report Schema",
    description:
      "Standardized 5-field report: clinic ID, status, staff count, stock levels, notes. Validated at edge before queuing.",
    href: "#",
    artifact: (
      <div className="grid grid-cols-2 gap-1 rounded-md bg-neutral-50 p-2 ring-1 ring-neutral-200 text-[10px]">
        <span className="text-neutral-400">clinic_id</span>
        <span className="font-mono text-neutral-700">&quot;dsp-001&quot;</span>
        <span className="text-neutral-400">status</span>
        <span className="font-mono text-green-600">&quot;operational&quot;</span>
        <span className="text-neutral-400">staff_count</span>
        <span className="font-mono text-neutral-700">5</span>
        <span className="text-neutral-400">stock_level</span>
        <span className="font-mono text-neutral-700">92</span>
        <span className="text-neutral-400">notes</span>
        <span className="font-mono text-neutral-700">&quot;All clear&quot;</span>
      </div>
    ),
  },
  {
    title: "Audit Trail",
    description:
      "Every status change logged with timestamp and reporter. Immutable history for compliance and analysis.",
    href: "#",
    artifact: (
      <div className="space-y-1 rounded-md bg-neutral-50 p-2 ring-1 ring-neutral-200">
        {[
          { time: "14:32", event: "Status changed to operational", user: "S. Ndaba" },
          { time: "14:15", event: "Stock level updated: 92%", user: "S. Ndaba" },
          { time: "13:48", event: "Report submitted (offline queue)", user: "T. Mkhize" },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px]">
            <span className="font-mono text-neutral-400">{row.time}</span>
            <span className="text-neutral-600">{row.event}</span>
            <span className="ml-auto text-neutral-400">{row.user}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export function FeaturesSection() {
  return (
    <section className="relative border-t border-neutral-200 bg-white" id="features">
      <Grid
        cellSize={60}
        patternOffset={[0, 0]}
        className="text-neutral-200/50 [mask-image:radial-gradient(closest-side,black,transparent)]"
      />
      <MaxWidthWrapper className="relative py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
            Infrastructure
          </span>
          <h2 className="mt-6 font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl" style={{ textWrap: "balance" }}>
            Built to operate under pressure
          </h2>
          <p className="mt-4 text-base text-neutral-500">
            Every component of ClinicPulse is designed for the realities of South
            African healthcare infrastructure — intermittent connectivity, high
            load, and life-critical decisions.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="group rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
            >
              <h3 className="text-sm font-semibold text-neutral-900">
                {cap.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                {cap.description}
              </p>
              <div className="mt-3 overflow-hidden rounded-lg">
                {cap.artifact}
              </div>
              <Link
                href={cap.href}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-neutral-400 transition-colors hover:text-[#0D7A6B]"
              >
                Learn more
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/features-section.tsx
git commit -m "feat: rewrite features section as infrastructure deep-dive with UI artifacts"
```

---

### Task 17: Rewrite InterfaceShowcase with staggered cards

**Files:**
- Modify: `components/landing/interface-showcase.tsx`

- [ ] **Step 1: Write rewritten component**

```tsx
"use client";

import { motion } from "motion/react";
import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { StatusBadge } from "./status-badge";

const interfaces = [
  {
    audience: "For District Officials",
    title: "District Console",
    description:
      "Data-dense desktop interface with live maps, drill-down tables, and real-time analytics. Every clinic visible at a glance.",
    offset: "lg:mt-0",
    visual: (
      <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Real-time · Last updated 2m ago
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { val: "2,847", label: "Operational", color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
            { val: "287", label: "Degraded", color: "border-amber-200 bg-amber-50 text-amber-700" },
            { val: "107", label: "Down", color: "border-red-200 bg-red-50 text-red-700" },
          ].map((s) => (
            <div key={s.label} className={`rounded-md border p-1.5 text-center ${s.color}`}>
              <div className="text-[11px] font-semibold">{s.val}</div>
              <div className="text-[7px] uppercase tracking-wider opacity-70">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          {["Diepsloot CHC", "Mamelodi Clinic", "Alexandra PHC"].map((name, i) => (
            <div key={name} className="flex items-center justify-between rounded-md bg-white px-2 py-1.5 ring-1 ring-neutral-200">
              <span className="text-[10px] font-medium text-neutral-700">{name}</span>
              <StatusBadge status={["operational", "degraded", "non-functional"][i] as "operational" | "degraded" | "non-functional"} showDot={false} className="text-[8px] px-1.5 py-0" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    audience: "For Field Workers",
    title: "Mobile Field Reports",
    description:
      "Offline-first PWA. Three screens: clinic list → 5-field report form → confirmation. Queues locally, syncs when online.",
    offset: "lg:mt-8",
    visual: (
      <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2">
          <div className="text-[10px] font-semibold text-emerald-800">Diepsloot CHC</div>
          <div className="text-[8px] text-emerald-600">1.2 km · Operational</div>
        </div>
        <div className="space-y-1.5">
          {["Clinic open?", "Staff level?", "Medicine stocked?", "Queue length?", "Notes"].map((field, i) => (
            <div key={field} className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 ring-1 ring-neutral-200">
              <div className={`h-3 w-3 rounded border-2 ${i === 0 ? "border-emerald-400 bg-emerald-400" : "border-neutral-300"}`}>
                {i === 0 && <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className="text-[9px] text-neutral-500">{field}</span>
            </div>
          ))}
        </div>
        <div className="rounded-md bg-[#0D7A6B] px-2 py-1.5 text-center text-[9px] font-semibold text-white">Submit Report</div>
      </div>
    ),
  },
  {
    audience: "For Patients & Public",
    title: "Public Clinic Finder",
    description:
      "No login. No app install. Search by suburb, see status badges, get directions. Loads in under 2 seconds on 3G.",
    offset: "lg:mt-16",
    visual: (
      <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <div className="flex items-center gap-2 rounded-lg border bg-white px-2.5 py-2 ring-1 ring-neutral-200">
          <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <span className="text-[10px] text-neutral-400">Search suburb or clinic...</span>
        </div>
        {[
          { name: "Soweto CHC", dist: "2.1 km", status: "operational" as const },
          { name: "Sandton Clinic", dist: "4.8 km", status: "degraded" as const },
        ].map((clinic) => (
          <div key={clinic.name} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-2 ring-1 ring-neutral-200">
            <div>
              <div className="text-[10px] font-medium text-neutral-800">{clinic.name}</div>
              <div className="text-[8px] text-neutral-400">{clinic.dist}</div>
            </div>
            <StatusBadge status={clinic.status} showDot={false} className="text-[8px] px-1.5 py-0" />
          </div>
        ))}
        <div className="flex items-center justify-center gap-1 text-[8px] text-neutral-400">
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Get directions on Google Maps
        </div>
      </div>
    ),
  },
];

export function InterfaceShowcase() {
  return (
    <section className="relative border-t border-neutral-200 bg-neutral-50">
      <MaxWidthWrapper className="py-16 sm:py-20 lg:py-24">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
          Three Interfaces
        </p>
        <h2 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl" style={{ textWrap: "balance" }}>
          One system, built for every user
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-500">
          Each interface is purpose-built for its users — from district officials
          monitoring 3,500 clinics to patients finding the nearest open facility.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {interfaces.map((iface, i) => (
            <motion.div
              key={iface.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
              className={`group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md ${iface.offset}`}
            >
              <div className="border-b border-neutral-100 bg-gradient-to-r from-[#0D7A6B]/5 to-transparent px-5 py-4">
                <p className="text-[11px] font-medium text-[#0D7A6B]">{iface.audience}</p>
                <h3 className="mt-0.5 text-base font-semibold text-neutral-900">{iface.title}</h3>
              </div>
              <div className="p-5">
                <p className="mb-4 text-sm leading-relaxed text-neutral-500">{iface.description}</p>
                {iface.visual}
              </div>
            </motion.div>
          ))}
        </div>
      </MaxWidthWrapper>
      <ProgressiveBlur className="absolute bottom-0 left-0 right-0 h-32" side="top" strength={16} steps={3} />
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/interface-showcase.tsx
git commit -m "feat: rewrite interface showcase with staggered cards and ProgressiveBlur"
```

---

### Task 18: Rewrite SocialProof with avatars and pull quotes

**Files:**
- Modify: `components/landing/social-proof.tsx`

- [ ] **Step 1: Write rewritten component with typo fix**

```tsx
"use client";

import { motion } from "motion/react";
import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";

const testimonials = [
  {
    quote: "ClinicPulse gave us real-time visibility we never had with DHIS2. We can now redirect patients before they travel to a closed clinic.",
    author: "Dr. Thandi Mkhize",
    role: "District Health Manager, Gauteng Province",
  },
  {
    quote: "Finally, a single source of truth for clinic status. The district console replaced three spreadsheets and a WhatsApp group.",
    author: "Naledi van der Merwe",
    role: "Program Director, BroadReach Health",
  },
  {
    quote: "The offline field reports changed how our community health workers operate. No more paper forms that take weeks to reach headquarters.",
    author: "Sipho Ndaba",
    role: "Field Operations Lead, Right to Care",
  },
];

export function SocialProofSection() {
  return (
    <section className="border-t border-neutral-200 bg-white" id="proof">
      <MaxWidthWrapper className="py-16 sm:py-20 lg:py-24">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-[#0D7A6B]">
          Testimonials
        </p>
        <h2 className="mx-auto mb-14 max-w-[600px] text-center font-display text-3xl font-medium leading-[1.15] tracking-tight text-neutral-900 sm:text-4xl" style={{ textWrap: "balance" }}>
          Trusted by the people on the ground
        </h2>

        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className={`flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm ring-1 ring-black/5 ${i === 0 ? "lg:col-span-2 lg:row-span-2" : ""}`}
            >
              <p className="mb-6 flex-1 text-[15px] leading-relaxed text-neutral-600" style={{ textWrap: "pretty" }}>
                <span className="font-display text-3xl text-[#0D7A6B]/30 leading-none">&ldquo;</span>
                {t.quote}
              </p>
              <div className="mt-auto flex items-center gap-3 border-t border-neutral-100 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0D7A6B]/10 text-sm font-semibold text-[#0D7A6B]">
                  {t.author.charAt(0)}
                  {t.author.split(" ").pop()?.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-900">{t.author}</div>
                  <div className="text-[12px] text-neutral-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/social-proof.tsx
git commit -m "feat: rewrite social proof with pull quotes, avatars, fix spreadsheet typo"
```

---

### Task 19: Create ScaleSection with animated counters

**Files:**
- Create: `components/landing/scale-section.tsx`

- [ ] **Step 1: Write component**

```tsx
"use client";

import { motion } from "motion/react";
import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";

const stats = [
  { value: "3,500+", label: "Clinics monitored" },
  { value: "12,000+", label: "Reports processed monthly" },
  { value: "45,000+", label: "Patients rerouted" },
];

export function ScaleSection() {
  return (
    <section className="relative overflow-hidden border-t border-neutral-800 bg-neutral-900">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0D7A6B] opacity-[0.06] blur-[120px]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>
      <MaxWidthWrapper className="relative py-20 sm:py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
            Built to operate at national scale
          </h2>
          <p className="mx-auto mt-4 max-w-[500px] text-base text-white/50">
            Our infrastructure handles real-time data from thousands of clinics
            across all nine provinces, every day.
          </p>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative"
              >
                <div className="mx-auto h-20 w-20">
                  <span className="absolute inset-0 animate-pulse-scale rounded-full bg-[#0D7A6B]/20" />
                </div>
                <div className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-white/50">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </MaxWidthWrapper>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/scale-section.tsx
git commit -m "feat: add ScaleSection with animated counters and pulse-scale background"
```

---

### Task 20: Rewrite CTASection with dark operations-room panel

**Files:**
- Modify: `components/landing/cta-section.tsx`

- [ ] **Step 1: Write rewritten component**

```tsx
"use client";

import { motion } from "motion/react";
import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { ButtonLink } from "./button-link";

export function CTASection() {
  return (
    <section className="relative border-t border-neutral-800 bg-neutral-900">
      <ProgressiveBlur className="absolute top-0 left-0 right-0 h-32" side="bottom" strength={16} steps={3} />
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "conic-gradient(from 180deg, #0D7A6B, #22c55e, #f59e0b, #ef4444, #0D7A6B)", filter: "blur(120px)", opacity: 0.08 }} />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      </div>
      <MaxWidthWrapper className="relative py-20 text-center sm:py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mx-auto max-w-[600px] font-display text-3xl font-medium leading-[1.15] tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
            See the clinic network before the crisis reaches the queue.
          </h2>
          <p className="mx-auto mt-5 max-w-[480px] text-base text-white/50">
            Join the health organizations using ClinicPulse for real-time
            clinic intelligence across South Africa.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <ButtonLink href="/demo" variant="primary">
              Request Demo
              <svg className="ml-1 size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </ButtonLink>
            <a href="#product" className="flex h-8 items-center rounded-lg border border-white/20 px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
              Explore product flow
            </a>
          </div>
        </motion.div>
      </MaxWidthWrapper>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/cta-section.tsx
git commit -m "feat: rewrite CTA with dark operations-room panel and ProgressiveBlur"
```

---

### Task 21: Rewrite Footer with dub.co glass style

**Files:**
- Modify: `components/landing/footer.tsx`

- [ ] **Step 1: Write rewritten component**

```tsx
import { cn } from "@/lib/utils";
import Link from "next/link";

const navigation = {
  product: [
    { name: "District Console", href: "/platform" },
    { name: "Field Reports", href: "/features" },
    { name: "Clinic Finder", href: "/features" },
    { name: "API", href: "/api" },
  ],
  solutions: [
    { name: "District Health", href: "/solutions" },
    { name: "NGO Operations", href: "/solutions" },
    { name: "Field Teams", href: "/solutions" },
  ],
  resources: [
    { name: "Documentation", href: "/docs" },
    { name: "Help Center", href: "/help" },
    { name: "Contact", href: "/contact" },
  ],
};

const socials = [
  { name: "GitHub", href: "https://github.com/clinicpulse/clinicpulse", icon: GithubIcon },
  { name: "Twitter", href: "https://twitter.com/clinicpulse", icon: TwitterIcon },
  { name: "LinkedIn", href: "https://linkedin.com/company/clinicpulse", icon: LinkedInIcon },
];

function GithubIcon() {
  return (
    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="mx-auto w-full max-w-screen-xl px-3 lg:px-10">
        <div className="relative z-10 overflow-hidden rounded-t-2xl border border-b-0 border-neutral-200 bg-white/50 px-6 py-16 backdrop-blur-lg sm:px-10">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="flex flex-col gap-6">
              <div className="grow">
                <Link href="/" className="block max-w-fit">
                  <span className="text-sm font-semibold tracking-tight text-neutral-900">
                    ClinicPulse
                  </span>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                {socials.map(({ name, href, icon: Icon }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-full p-1"
                  >
                    <span className="sr-only">{name}</span>
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
            <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0 lg:grid-cols-3">
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Product</h3>
                <ul role="list" className="mt-3 flex flex-col gap-3">
                  {navigation.product.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm text-neutral-500 transition-colors hover:text-neutral-700">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Solutions</h3>
                <ul role="list" className="mt-3 flex flex-col gap-3">
                  {navigation.solutions.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm text-neutral-500 transition-colors hover:text-neutral-700">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 lg:mt-0">
                <h3 className="text-sm font-medium text-neutral-900">Resources</h3>
                <ul role="list" className="mt-3 flex flex-col gap-3">
                  {navigation.resources.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm text-neutral-500 transition-colors hover:text-neutral-700">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs text-neutral-500">All systems operational</span>
            </div>
            <p className="text-xs text-neutral-500">
              © {new Date().getFullYear()} ClinicPulse. Built for South Africa&apos;s primary healthcare system.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/footer.tsx
git commit -m "feat: rewrite footer with dub.co glass style, social icons, 3-column links"
```

---

### Task 22: Update page.tsx composition and add Background

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Rewrite page.tsx with new section composition**

```tsx
import { Background } from "@/components/ui/background";
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { Manifesto } from "@/components/landing/manifesto";
import { ProductModules } from "@/components/landing/product-modules";
import { InterfaceShowcase } from "@/components/landing/interface-showcase";
import { FeaturesSection } from "@/components/landing/features-section";
import { SocialProofSection } from "@/components/landing/social-proof";
import { ScaleSection } from "@/components/landing/scale-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Background />
      <Nav />
      <main>
        <Hero />
        <TrustStrip />
        <Manifesto />
        <ProductModules />
        <InterfaceShowcase />
        <FeaturesSection />
        <SocialProofSection />
        <ScaleSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: update page composition with new sections and Background"
```

---

### Task 23: Build and lint verification

- [ ] **Step 1: Run lint**

```bash
npm run lint 2>&1
```

Fix any lint errors found. Expected: zero errors.

- [ ] **Step 2: Run build**

```bash
npm run build 2>&1
```

Fix any build errors (unused imports, type errors, etc.). Expected: successful build.

- [ ] **Step 3: Remove unused files**

Check if any old components are now unused after the rewrite:
```bash
grep -rn "from.*demo-card\|from.*problem-section\|from.*logo-carousel" app/ --include="*.tsx" --include="*.ts"
```

If DemoCard, ProblemSection, or LogoCarousel are no longer imported anywhere, they can optionally be removed (not required — they may be used elsewhere).

- [ ] **Step 4: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix: build and lint fixes"
```
