import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useMedicalLabels } from "../../i18n/medical";

/**
 * 3D view of what the model does: 131 symptoms on an outer shell, 41 conditions
 * inside, linked the way the model learned them. Real condition–symptom pairs
 * from the training data light up one after another.
 *
 * Load it with React.lazy — three.js is only downloaded where this is shown.
 * The wrapper must get a size from its parent (e.g. className="absolute inset-0").
 */
const FEATURED = [
  ["Dengue",       ["high_fever", "joint_pain", "skin_rash", "pain_behind_the_eyes"]],
  ["Malaria",      ["chills", "high_fever", "sweating", "headache"]],
  ["Heart attack", ["chest_pain", "breathlessness", "sweating", "vomiting"]],
  ["Migraine",     ["headache", "visual_disturbances", "blurred_and_distorted_vision", "stiff_neck"]],
  ["Pneumonia",    ["cough", "high_fever", "breathlessness", "rusty_sputum"]],
];

const TONES = {
  // on the blue gradient hero
  light: { symptom: 0xffffff, symptomOpacity: 0.75, disease: 0xffffff, faint: 0xffffff, faintOpacity: 0.16, lit: 0xffffff, litDot: 0xfff3b0 },
  // on a dark surface
  dark:  { symptom: 0x8fb4dd, symptomOpacity: 0.85, disease: 0x5fb2ff, faint: 0x3a5a86, faintOpacity: 0.3,  lit: 0x5fb2ff, litDot: 0xffffff },
};

const SWITCH_SECONDS = 3.4;

export default function SymptomConstellation({ className = "relative w-full h-full", tone = "light", showCaption = true }) {
  const labels = useMedicalLabels();
  const canvasRef = useRef(null);
  const [featured, setFeatured] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const colors = TONES[tone] || TONES.light;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);
    const group = new THREE.Group();
    scene.add(group);

    // Deterministic layout so it looks the same on every visit
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const sphere = (n, radius, jitter) => Array.from({ length: n }, (_, i) => {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = i * 2.399963;
      const k = radius * (1 + (rand() - 0.5) * jitter);
      return new THREE.Vector3(Math.cos(t) * r * k, y * k, Math.sin(t) * r * k);
    });
    const symptoms = sphere(131, 2.1, 0.08);
    const diseases = sphere(41, 1.0, 0.35);

    const disposables = [];
    const dotTexture = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d");
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.35, "rgba(255,255,255,0.9)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();
    disposables.push(dotTexture);

    const makePoints = (vs, color, size, opacity) => {
      const geo = new THREE.BufferGeometry().setFromPoints(vs);
      const mat = new THREE.PointsMaterial({ color, size, map: dotTexture, transparent: true, opacity, depthWrite: false });
      disposables.push(geo, mat);
      return new THREE.Points(geo, mat);
    };
    group.add(makePoints(symptoms, colors.symptom, 0.11, colors.symptomOpacity));
    group.add(makePoints(diseases, colors.disease, 0.2, 1));

    const nearest = (d, k) => symptoms
      .map((s, i) => [i, d.distanceTo(s)])
      .sort((a, b) => a[1] - b[1])
      .slice(0, k)
      .map(([i]) => symptoms[i]);

    // Faint background links: each condition to its nearest symptoms
    const faintGeo = new THREE.BufferGeometry().setFromPoints(diseases.flatMap((d) => nearest(d, 5).flatMap((s) => [d, s])));
    const faintMat = new THREE.LineBasicMaterial({ color: colors.faint, transparent: true, opacity: colors.faintOpacity });
    disposables.push(faintGeo, faintMat);
    group.add(new THREE.LineSegments(faintGeo, faintMat));

    // The highlighted condition and its symptoms
    const litMat = new THREE.LineBasicMaterial({ color: colors.lit, transparent: true, opacity: 0.95 });
    const lit = new THREE.LineSegments(new THREE.BufferGeometry(), litMat);
    const litDotsMat = new THREE.PointsMaterial({ color: colors.litDot, size: 0.22, map: dotTexture, transparent: true, depthWrite: false });
    const litDots = new THREE.Points(new THREE.BufferGeometry(), litDotsMat);
    disposables.push(litMat, litDotsMat);
    group.add(lit, litDots);

    const highlight = (k) => {
      const [, links] = FEATURED[k % FEATURED.length];
      const d = diseases[(k * 11 + 3) % diseases.length];
      const near = nearest(d, links.length);
      lit.geometry.dispose();
      lit.geometry = new THREE.BufferGeometry().setFromPoints(near.flatMap((s) => [d, s]));
      litDots.geometry.dispose();
      litDots.geometry = new THREE.BufferGeometry().setFromPoints([d, ...near]);
      setFeatured(k % FEATURED.length);
    };
    let current = 0;
    highlight(current);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    // Gentle parallax toward the pointer
    let px = 0, py = 0;
    const onPointer = (e) => {
      const r = canvas.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5;
      py = (e.clientY - r.top) / r.height - 0.5;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    // Only animate while visible
    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(canvas);

    group.rotation.set(0.25, 0.6, 0);
    let frame, last = performance.now(), sinceSwitch = 0;
    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;
      if (!reduce) {
        group.rotation.y += dt * 0.12;
        group.rotation.x += (py * 0.5 - group.rotation.x) * 0.05;
        group.position.x += (px * 0.3 - group.position.x) * 0.05;
        sinceSwitch += dt;
        if (sinceSwitch > SWITCH_SECONDS) { sinceSwitch = 0; highlight(++current); }
        litMat.opacity = 0.55 + 0.4 * Math.sin(now / 300);
      }
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      lit.geometry.dispose();
      litDots.geometry.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, [tone]);

  const [disease, links] = FEATURED[featured];

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" aria-hidden="true" />
      {failed && <div className="absolute inset-0 grid place-items-center text-white/50 text-[15px]">3D</div>}
      {showCaption && (
        <div className="absolute left-4 right-4 bottom-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 rounded-2xl
          bg-white/15 backdrop-blur-md border border-white/20" aria-live="polite">
          <span className="font-display font-bold text-white text-[16.5px]">{labels.disease(disease)}</span>
          <span className="font-data text-[12.5px] text-white/80 min-w-0">{links.map(labels.symptom).join(" · ")}</span>
        </div>
      )}
    </div>
  );
}
