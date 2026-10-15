"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  z: number; // độ sâu: 0.2 (xa) -> 1 (gần)
  phase: number;
  speed: number;
  fill: string;
};
// t: khoảng cách tới tâm, chuẩn hóa 0 -> 1
type GalaxyDot = {
  t: number;
  angle: number;
  size: number;
  alpha: number;
  phase: number;
  fill: string;
};
type Meteor = { x: number; y: number; vx: number; vy: number; life: number };

const ARMS = 2;
const ARM_WIND = 3.4; // độ xoắn của nhánh
const FLAT = 0.38; // tỉ lệ nén theo chiều dọc (đĩa thiên hà nghiêng)
const TILT = -0.45; // góc nghiêng của thiên hà (radian)
const LIT_DOTS = 2400;
const EMBER_DOTS = 450;
const DUST_DOTS = 700;
const BG_STARS = 480;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// Màu theo khoảng cách tới tâm: trắng vàng -> vàng -> cam -> xanh lam/chàm
const COLOR_STOPS: [number, number, number, number][] = [
  [0, 255, 244, 214],
  [0.22, 255, 206, 120],
  [0.45, 235, 160, 80],
  [0.62, 150, 150, 230],
  [1, 90, 110, 235],
];

function starColor(t: number) {
  for (let i = 1; i < COLOR_STOPS.length; i++) {
    const [t1, r1, g1, b1] = COLOR_STOPS[i];
    if (t <= t1) {
      const [t0, r0, g0, b0] = COLOR_STOPS[i - 1];
      const k = (t - t0) / (t1 - t0);
      return `rgb(${Math.round(r0 + (r1 - r0) * k)}, ${Math.round(
        g0 + (g1 - g0) * k,
      )}, ${Math.round(b0 + (b1 - b0) * k)})`;
    }
  }
  return "rgb(90, 110, 235)";
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type GalaxyBackgroundProps = {
  /**
   * true: tắt chuyển động khi hệ điều hành bật "giảm chuyển động".
   * false (mặc định): luôn chạy animation.
   */
  respectReducedMotion?: boolean;
};

export function GalaxyBackground({
  respectReducedMotion = false,
}: GalaxyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion =
      respectReducedMotion &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let litDots: GalaxyDot[] = [];
    let emberDots: GalaxyDot[] = [];
    let dustDots: GalaxyDot[] = [];
    let meteors: Meteor[] = [];
    let startTime = 0;
    let nextMeteorAt = 0;
    let frame = 0;

    // Parallax theo chuột (làm mượt dần)
    const pointer = { tx: 0, ty: 0, x: 0, y: 0 };

    const galaxyRadius = () => Math.hypot(width, height) * 0.48;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Sao nền dày đặc, đa số trắng, một ít xanh nhạt và vàng nhạt
      stars = Array.from({ length: BG_STARS }, () => {
        const z = rand(0.2, 1);
        const pick = Math.random();
        const fill =
          pick < 0.7
            ? "rgb(255, 255, 255)"
            : pick < 0.85
              ? "rgb(190, 210, 255)"
              : "rgb(255, 235, 200)";
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: rand(0.25, 1.15) * (0.6 + z * 0.7),
          z,
          phase: Math.random() * Math.PI * 2,
          speed: rand(0.001, 0.004),
          fill,
        };
      });

      // Sao trong đĩa thiên hà: một phần nằm theo nhánh xoắn, một phần rải đều trong đĩa
      litDots = Array.from({ length: LIT_DOTS }, (_, i) => {
        const t = Math.pow(Math.random(), 1.25);
        const arm = i % ARMS;
        const onArm = (arm / ARMS) * Math.PI * 2 + t * ARM_WIND;
        const angle =
          Math.random() < 0.4
            ? Math.random() * Math.PI * 2
            : onArm + rand(-1, 1) * (0.3 + t * 0.45);
        return {
          t,
          angle,
          size: rand(0.4, 1.5) * (1.2 - t * 0.5),
          alpha: rand(0.3, 0.95) * (1 - t * 0.5),
          phase: Math.random() * Math.PI * 2,
          fill: starColor(t),
        };
      });

      // Hạt cam gỉ sét dọc theo vành bụi bên trong (như vệt cam trong ảnh Andromeda)
      emberDots = Array.from({ length: EMBER_DOTS }, (_, i) => {
        const t = rand(0.28, 0.62);
        const arm = i % ARMS;
        return {
          t,
          angle: (arm / ARMS) * Math.PI * 2 + t * ARM_WIND + 0.12 + rand(-0.1, 0.1),
          size: rand(0.6, 1.7),
          alpha: rand(0.4, 0.9),
          phase: Math.random() * Math.PI * 2,
          fill: "rgb(215, 105, 45)",
        };
      });

      // Vệt bụi tối nâu chạy dọc nhánh, che bớt ánh sáng phía sau
      dustDots = Array.from({ length: DUST_DOTS }, (_, i) => {
        const t = rand(0.28, 0.64);
        const arm = i % ARMS;
        return {
          t,
          angle: (arm / ARMS) * Math.PI * 2 + t * ARM_WIND + 0.2 + rand(-0.12, 0.12),
          size: rand(3, 9),
          alpha: rand(0.05, 0.16),
          phase: 0,
          fill: "rgb(45, 20, 8)",
        };
      });
    };

    const drawStars = (time: number, intro: number) => {
      for (const s of stars) {
        if (!reduceMotion) {
          // Sao trôi chậm sang trái, sao gần trôi nhanh hơn
          s.x -= 0.06 * s.z;
          if (s.x < -4) s.x = width + 4;
        }

        const px = s.x + pointer.x * 26 * s.z;
        const py = s.y + pointer.y * 18 * s.z;
        const twinkle = reduceMotion
          ? 0.7
          : 0.4 + 0.6 * Math.abs(Math.sin(time * s.speed + s.phase));

        ctx.globalAlpha = twinkle * intro;
        ctx.fillStyle = s.fill;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();

        // Sao gần lớn hơn có thêm vầng sáng khi đang chớp sáng
        if (s.z > 0.85 && twinkle > 0.85) {
          ctx.globalAlpha = (twinkle - 0.85) * 1.6 * intro;
          ctx.fillStyle = "rgb(190, 200, 255)";
          ctx.beginPath();
          ctx.arc(px, py, s.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const drawGalaxy = (time: number, intro: number) => {
      const R = galaxyRadius();
      const k = Math.max(0.8, Math.min(R / 700, 1.8));
      const cx = width * 0.5 + pointer.x * 14;
      const cy = height * 0.5 + pointer.y * 9;
      const rotation = reduceMotion ? 0 : time * 0.0001;
      const scale = 0.55 + 0.45 * intro; // thiên hà "nở" ra khi vừa tải trang
      const pulse = reduceMotion ? 1 : 1 + 0.08 * Math.sin(time * 0.0014);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(TILT + pointer.x * 0.04);
      ctx.scale(scale, scale * FLAT);
      ctx.globalCompositeOperation = "lighter";

      // Đĩa sáng: vàng ở giữa, chuyển dần sang xanh chàm ở rìa
      ctx.globalAlpha = intro;
      const disc = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
      disc.addColorStop(0, "rgba(255, 200, 120, 0.30)");
      disc.addColorStop(0.25, "rgba(240, 160, 80, 0.20)");
      disc.addColorStop(0.55, "rgba(110, 120, 230, 0.14)");
      disc.addColorStop(0.85, "rgba(70, 90, 210, 0.08)");
      disc.addColorStop(1, "rgba(40, 60, 180, 0)");
      ctx.fillStyle = disc;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fill();

      // Lõi vàng rực, "thở" nhẹ
      const coreR = R * 0.28 * pulse;
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
      core.addColorStop(0, "rgba(255, 250, 230, 0.95)");
      core.addColorStop(0.12, "rgba(255, 225, 150, 0.75)");
      core.addColorStop(0.4, "rgba(255, 185, 90, 0.35)");
      core.addColorStop(1, "rgba(255, 150, 60, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, coreR, 0, Math.PI * 2);
      ctx.fill();

      const spin = (d: GalaxyDot) => d.angle + rotation * (1.6 - d.t);

      // Sao sáng và hạt cam (cộng sáng)
      for (const d of litDots) {
        const a = spin(d);
        const flicker = reduceMotion
          ? 1
          : 0.7 + 0.3 * Math.sin(time * 0.0025 + d.phase);
        ctx.globalAlpha = d.alpha * flicker * intro;
        ctx.fillStyle = d.fill;
        ctx.beginPath();
        ctx.arc(
          Math.cos(a) * d.t * R,
          Math.sin(a) * d.t * R,
          d.size * Math.min(k, 1.3),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      for (const d of emberDots) {
        const a = spin(d);
        const flicker = reduceMotion
          ? 1
          : 0.75 + 0.25 * Math.sin(time * 0.002 + d.phase);
        ctx.globalAlpha = d.alpha * flicker * intro;
        ctx.fillStyle = d.fill;
        ctx.beginPath();
        ctx.arc(
          Math.cos(a) * d.t * R,
          Math.sin(a) * d.t * R,
          d.size * Math.min(k, 1.3),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      // Vệt bụi tối: vẽ đè (không cộng sáng) để tạo các đường tối như trong ảnh
      ctx.globalCompositeOperation = "source-over";
      for (const d of dustDots) {
        const a = spin(d);
        ctx.globalAlpha = d.alpha * intro;
        ctx.fillStyle = d.fill;
        ctx.beginPath();
        ctx.arc(
          Math.cos(a) * d.t * R,
          Math.sin(a) * d.t * R,
          d.size * k,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      ctx.restore();
    };

    // Hai thiên hà vệ tinh nhỏ (giống M32 và M110 cạnh Andromeda)
    const drawSatellites = (intro: number) => {
      const unit = Math.max(0.7, Math.min(Math.min(width, height) / 800, 1.4));
      const cx = width * 0.5;
      const cy = height * 0.5;

      const satellite = (
        x: number,
        y: number,
        radius: number,
        flat: number,
        angle: number,
        inner: string,
        mid: string,
      ) => {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = intro;
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(1, flat);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        g.addColorStop(0, inner);
        g.addColorStop(0.2, mid);
        g.addColorStop(0.5, "rgba(110, 130, 240, 0.28)");
        g.addColorStop(1, "rgba(60, 80, 220, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      // Tròn, trắng xanh, ở phía trên bên trái tâm
      satellite(
        cx - width * 0.17 + pointer.x * 22,
        cy - height * 0.09 + pointer.y * 15,
        18 * unit,
        1,
        0,
        "rgba(255, 252, 240, 0.95)",
        "rgba(200, 215, 255, 0.7)",
      );
      // Thon dài, lõi vàng, ở phía dưới bên phải
      satellite(
        cx + width * 0.26 + pointer.x * 22,
        cy + height * 0.4 + pointer.y * 15,
        38 * unit,
        0.5,
        -0.5,
        "rgba(255, 215, 150, 0.9)",
        "rgba(240, 190, 140, 0.5)",
      );
    };

    const spawnMeteor = () => {
      meteors.push({
        x: rand(width * 0.3, width * 1.05),
        y: rand(-20, height * 0.45),
        vx: -rand(8, 13),
        vy: rand(3.5, 6),
        life: 1,
      });
    };

    const drawMeteors = (time: number) => {
      if (reduceMotion) return;

      if (time > nextMeteorAt) {
        spawnMeteor();
        if (Math.random() < 0.3) spawnMeteor(); // thỉnh thoảng có mưa sao băng đôi
        nextMeteorAt = time + rand(1800, 4500);
      }

      meteors = meteors.filter((m) => m.life > 0);
      for (const m of meteors) {
        const tail = 16;
        const tx = m.x - m.vx * tail;
        const ty = m.y - m.vy * tail;
        const grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
        grad.addColorStop(0, `rgba(255, 255, 255, ${m.life})`);
        grad.addColorStop(0.3, `rgba(150, 215, 255, ${m.life * 0.5})`);
        grad.addColorStop(1, "rgba(90, 200, 255, 0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.012;
      }
    };

    const render = (time: number) => {
      if (!startTime) {
        startTime = time;
        nextMeteorAt = time + 2500;
      }
      const introProgress = reduceMotion
        ? 1
        : Math.min(1, (time - startTime) / 2600);
      const intro = easeOutCubic(introProgress);

      // Làm mượt chuyển động parallax
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      ctx.clearRect(0, 0, width, height);
      drawStars(time, intro);
      drawGalaxy(time, intro);
      drawSatellites(intro);
      drawMeteors(time);
      if (!reduceMotion) frame = requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.tx = (event.clientX / width - 0.5) * 2;
      pointer.ty = (event.clientY / height - 0.5) * 2;
    };
    const onResize = () => {
      build();
      if (reduceMotion) render(performance.now());
    };

    build();
    frame = requestAnimationFrame(render);
    window.addEventListener("resize", onResize);
    if (!reduceMotion) window.addEventListener("pointermove", onPointerMove);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [respectReducedMotion]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-black ${
        respectReducedMotion ? "galaxy-respect" : ""
      }`}
    >
      <style>{`
        @keyframes galaxy-drift-a {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.9; }
          50% { transform: translate3d(6%, 4%, 0) scale(1.15); opacity: 1; }
        }
        @keyframes galaxy-drift-b {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1.1); opacity: 0.8; }
          50% { transform: translate3d(-7%, -5%, 0) scale(0.95); opacity: 1; }
        }
        @keyframes galaxy-drift-c {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate3d(-4%, 6%, 0) scale(1.25); opacity: 0.9; }
        }
        .galaxy-blob { position: absolute; border-radius: 9999px; filter: blur(60px); will-change: transform, opacity; }
        .galaxy-blob-a { animation: galaxy-drift-a 18s ease-in-out infinite; }
        .galaxy-blob-b { animation: galaxy-drift-b 24s ease-in-out infinite; }
        .galaxy-blob-c { animation: galaxy-drift-c 30s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .galaxy-respect .galaxy-blob { animation: none; }
        }
      `}</style>

      {/* Tinh vân: các đám mây màu (lục lam, xanh dương, cam, đỏ hồng) trôi chậm trên nền đen */}
      <div
        className="galaxy-blob galaxy-blob-a left-[-12%] top-[-18%] h-[60vmax] w-[60vmax]"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 175, 165, 0.3), transparent 70%)",
        }}
      />
      <div
        className="galaxy-blob galaxy-blob-b bottom-[-22%] right-[-12%] h-[65vmax] w-[65vmax]"
        style={{
          background:
            "radial-gradient(circle, rgba(25, 100, 230, 0.32), transparent 70%)",
        }}
      />
      <div
        className="galaxy-blob galaxy-blob-c right-[2%] top-[-5%] h-[42vmax] w-[42vmax]"
        style={{
          background:
            "radial-gradient(circle, rgba(255, 125, 40, 0.2), transparent 70%)",
        }}
      />
      <div
        className="galaxy-blob galaxy-blob-a bottom-[-10%] left-[8%] h-[38vmax] w-[38vmax]"
        style={{
          background:
            "radial-gradient(circle, rgba(225, 45, 75, 0.16), transparent 70%)",
        }}
      />

      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Làm tối nhẹ phần giữa để form dễ đọc */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.4),transparent_60%)]" />
    </div>
  );
}