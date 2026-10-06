import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as THREE from "three";
import { useMedicalLabels } from "../../i18n/medical";
import { dateLocale } from "../../i18n";
import { getTheme, onThemeChange } from "../../theme";

/**
 * Confidence over time in 3D: one pillar per analysis, its height the model's
 * confidence on a fixed 0–100% scale (reference lines at 25/50/75/100%), its
 * color the urgency level. A line joins the tops. Drag to turn the view; hover
 * a pillar for the exact values; click to open that analysis.
 *
 * Load it with React.lazy — three.js is only downloaded where this is shown.
 */
const STEP = 1.5;          // spacing between analyses
const HEIGHT = 3;          // 100% confidence
const LEVELS = [0.25, 0.5, 0.75, 1];
const URGENCY_TOKEN = { low: "--good", moderate: "--warn", high: "--serious", emergency: "--bad" };

/** A theme color token ("R G B" channels) as a three.js color. */
const tokenColor = (name) => {
  const [r, g, b] = getComputedStyle(document.documentElement).getPropertyValue(name).trim().split(/\s+/).map(Number);
  return new THREE.Color(r / 255, g / 255, b / 255);
};

export default function HealthJourney3D({ points }) {
  const { t } = useTranslation();
  const labels = useMedicalLabels();
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const levelRefs = useRef([]);
  const dateRefs = useRef([]);
  const openRef = useRef(null);
  const [theme, setThemeState] = useState(getTheme());
  const [hover, setHover] = useState(null);       // { index, x, y }
  const [failed, setFailed] = useState(false);

  openRef.current = (i) => navigate(`/patient/results/${points[i].analysis_id}`);
  useEffect(() => onThemeChange(setThemeState), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return undefined;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const dark = theme === "dark";
    const accent = tokenColor("--accent");
    const ink = tokenColor("--ink");
    const disposables = [];
    const keep = (...items) => { disposables.push(...items); return items[0]; };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    const n = points.length;
    const L = (n - 1) * STEP;
    const xAt = (i) => i * STEP - L / 2;

    // Light
    scene.add(new THREE.AmbientLight(0xffffff, dark ? 0.55 : 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, dark ? 1.1 : 1.3);
    sun.position.set(4, 8, 6);
    scene.add(sun);
    const glow = new THREE.PointLight(accent, dark ? 14 : 8, 14);
    glow.position.set(0, HEIGHT + 1, 3);
    scene.add(glow);

    // Floor: a soft plate with lines across the timeline
    const floorW = L + 3.2, floorD = 3.2;
    const floor = new THREE.Mesh(
      keep(new THREE.PlaneGeometry(floorW, floorD)),
      keep(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: dark ? 0.08 : 0.07, depthWrite: false })),
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const floorLines = [];
    for (let z = -floorD / 2; z <= floorD / 2 + 0.01; z += 0.8) {
      floorLines.push(new THREE.Vector3(-floorW / 2, 0.001, z), new THREE.Vector3(floorW / 2, 0.001, z));
    }
    scene.add(new THREE.LineSegments(
      keep(new THREE.BufferGeometry().setFromPoints(floorLines)),
      keep(new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: dark ? 0.2 : 0.18 })),
    ));

    // Reference levels (25/50/75/100%) behind the pillars
    const levelMat = keep(new THREE.LineDashedMaterial({ color: ink, transparent: true, opacity: dark ? 0.22 : 0.18, dashSize: 0.18, gapSize: 0.12 }));
    LEVELS.forEach((v) => {
      const geo = keep(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-floorW / 2, v * HEIGHT, -0.9), new THREE.Vector3(floorW / 2, v * HEIGHT, -0.9),
      ]));
      const line = new THREE.Line(geo, levelMat);
      line.computeLineDistances();
      scene.add(line);
    });

    // Pillars: cylinder (base at y = 0) + glowing cap + a ring on the floor
    const pillarGeo = keep(new THREE.CylinderGeometry(0.2, 0.2, 1, 40));
    pillarGeo.translate(0, 0.5, 0);
    const capGeo = keep(new THREE.SphereGeometry(0.27, 32, 16));
    const ringGeo = keep(new THREE.RingGeometry(0.3, 0.52, 40));
    const pillars = points.map((p, i) => {
      const color = tokenColor(URGENCY_TOKEN[p.urgency] || "--good");
      const mat = keep(new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.25, roughness: 0.32, metalness: 0.15, transparent: true, opacity: 0.9,
      }));
      const capMat = keep(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, roughness: 0.2 }));
      const ringMat = keep(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
      const body = new THREE.Mesh(pillarGeo, mat);
      const cap = new THREE.Mesh(capGeo, capMat);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(xAt(i), 0.003, 0);
      body.position.set(xAt(i), 0, 0);
      cap.position.set(xAt(i), 0, 0);
      body.userData.index = cap.userData.index = i;
      scene.add(body, cap, ring);
      return { body, cap, mat, capMat, h: Math.max(p.confidence, 0.004) * HEIGHT };
    });

    // Trend line through the tops (straight segments: no invented values between analyses)
    const tops = points.map((p, i) => new THREE.Vector3(xAt(i), Math.max(p.confidence, 0.004) * HEIGHT, 0));
    const path = new THREE.CurvePath();
    for (let i = 1; i < n; i++) path.add(new THREE.LineCurve3(tops[i - 1], tops[i]));
    let tubeMat = null, pulse = null;
    if (n > 1) {
      tubeMat = keep(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0 }));
      scene.add(new THREE.Mesh(keep(new THREE.TubeGeometry(path, 60 * (n - 1), 0.045, 10, false)), tubeMat));
      pulse = new THREE.Mesh(keep(new THREE.SphereGeometry(0.11, 16, 12)), keep(new THREE.MeshBasicMaterial({ color: 0xffffff })));
      pulse.visible = false;
      scene.add(pulse);
    }

    // Camera: fit the whole timeline, look slightly from above and from the side
    const target = new THREE.Vector3(0, HEIGHT * 0.42, 0);
    let dist = 8;
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const vfov = THREE.MathUtils.degToRad(camera.fov);
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
      dist = Math.max((floorW / 2 + 0.6) / Math.tan(hfov / 2), (HEIGHT + 1.4) / (2 * Math.tan(vfov / 2))) + 1.2;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    // Drag to turn, hover for details, click to open
    let yawUser = 0, pitchUser = 0, dragging = false, moved = 0, lastX = 0, lastY = 0, hovered = -1;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pickables = pillars.flatMap((p) => [p.body, p.cap]);
    const pick = (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickables, false)[0];
      return { index: hit ? hit.object.userData.index : -1, x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onDown = (e) => { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture?.(e.pointerId); };
    const onMove = (e) => {
      if (dragging) {
        moved += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
        yawUser = THREE.MathUtils.clamp(yawUser + (e.clientX - lastX) * 0.006, -0.9, 0.9);
        pitchUser = THREE.MathUtils.clamp(pitchUser + (e.clientY - lastY) * 0.004, -0.2, 0.45);
        lastX = e.clientX; lastY = e.clientY;
      }
      const { index, x, y } = pick(e);
      hovered = index;
      canvas.style.cursor = index >= 0 ? "pointer" : dragging ? "grabbing" : "grab";
      setHover(index >= 0 ? { index, x, y } : null);
    };
    const onUp = (e) => {
      if (dragging && moved < 5) {
        const { index } = pick(e);
        if (index >= 0) openRef.current(index);
      }
      dragging = false;
    };
    const onLeave = () => { hovered = -1; setHover(null); };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);

    // HTML labels follow their 3D anchors
    const project = (v, el, center) => {
      if (!el) return;
      const p = v.clone().project(camera);
      const x = (p.x * 0.5 + 0.5) * canvas.clientWidth;
      const y = (-p.y * 0.5 + 0.5) * canvas.clientHeight;
      el.style.transform = `translate(${x}px, ${y}px) translate(${center ? "-50%" : "-100%"}, -50%)`;
    };
    const levelAnchors = LEVELS.map((v) => new THREE.Vector3(-floorW / 2 - 0.15, v * HEIGHT, -0.9));
    const dateAnchors = points.map((_, i) => new THREE.Vector3(xAt(i), -0.32, 0.55));

    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(canvas);

    const start = performance.now();
    let frame;
    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      if (!visible) return;
      const time = (now - start) / 1000;

      // Pillars grow in one after another, then the trend line appears
      pillars.forEach((p, i) => {
        const g = reduce ? 1 : THREE.MathUtils.clamp((time - i * 0.09) / 0.8, 0, 1);
        const eased = 1 - Math.pow(1 - g, 3);
        p.body.scale.y = Math.max(p.h * eased, 0.001);
        p.cap.position.y = p.h * eased;
        const on = hovered === i;
        p.mat.emissiveIntensity += ((on ? 0.6 : 0.25) - p.mat.emissiveIntensity) * 0.2;
        const s = on ? 1.25 : 1;
        p.cap.scale.setScalar(p.cap.scale.x + (s - p.cap.scale.x) * 0.2);
      });
      if (tubeMat) {
        const appear = reduce ? 1 : THREE.MathUtils.clamp((time - (n * 0.09 + 0.5)) / 0.6, 0, 1);
        tubeMat.opacity = 0.9 * appear;
        if (!reduce && appear >= 1) {
          pulse.visible = true;
          pulse.position.copy(path.getPointAt((time * 0.18) % 1));
        }
      }

      // Camera: gentle sway + the user's drag
      const yaw = -0.32 + yawUser + (reduce ? 0 : Math.sin(time * 0.25) * 0.1);
      const pitch = 0.3 + pitchUser;
      camera.position.set(
        target.x + dist * Math.sin(yaw) * Math.cos(pitch),
        target.y + dist * Math.sin(pitch),
        target.z + dist * Math.cos(yaw) * Math.cos(pitch),
      );
      camera.lookAt(target);
      renderer.render(scene, camera);

      levelAnchors.forEach((v, i) => project(v, levelRefs.current[i], false));
      dateAnchors.forEach((v, i) => project(v, dateRefs.current[i], true));
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, [points, theme]);

  const fmtDate = (d) => new Date(d).toLocaleDateString(dateLocale(), { day: "numeric", month: "short" });
  const showDate = (i) => points.length <= 10 || i % 2 === 0 || i === points.length - 1;
  const hp = hover && points[hover.index];

  return (
    <div ref={wrapRef} className="journey3d relative h-[400px] rounded-[22px] overflow-hidden select-none"
      role="img" aria-label={t("trends.chartTitle")}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block touch-none" style={{ cursor: "grab" }} />
      {failed && <div className="absolute inset-0 grid place-items-center text-muted">3D</div>}

      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {LEVELS.map((v, i) => (
          <span key={v} ref={el => { levelRefs.current[i] = el; }}
            className="absolute left-0 top-0 font-data text-[12px] text-dim whitespace-nowrap">{Math.round(v * 100)}%</span>
        ))}
        {points.map((p, i) => showDate(i) && (
          <span key={p.analysis_id} ref={el => { dateRefs.current[i] = el; }}
            className="absolute left-0 top-0 text-[12.5px] text-muted whitespace-nowrap">{fmtDate(p.date)}</span>
        ))}
      </div>

      {hp && (
        <div className="chart-tip !absolute" style={{ left: Math.min(hover.x + 14, (wrapRef.current?.clientWidth || 0) - 230), top: hover.y + 14 }}>
          <b>{labels.disease(hp.top_disease)}</b><br />
          {fmtDate(hp.date)} · {Math.round(hp.confidence * 100)}% · {t(`common.urgency.${hp.urgency || "low"}`)}
        </div>
      )}

      <p className="absolute right-4 bottom-3 text-[12.5px] text-dim pointer-events-none">{t("trends.hint3d")}</p>
    </div>
  );
}
