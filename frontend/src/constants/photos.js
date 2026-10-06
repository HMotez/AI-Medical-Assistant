/* Unsplash free medical photos — all verified, no attribution needed for dev */

export const PHOTOS = {
  /* Hero — doctor listening to patient, warm light, white coat */
  hero: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=1600&q=85",

  /* Login sidebar — doctor holding a stethoscope */
  login: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80",

  /* Register sidebar — modern hospital corridor, teal/blue tones */
  register: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=80",

  /* Patient dashboard header — young woman with health app on phone */
  patientDash: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1400&q=80",

  /* Symptom checker — doctor filling out medical form */
  symptomChecker: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1400&q=80",

  /* Results — lab researcher looking at results */
  results: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1400&q=80",

  /* History — medical records, files, paperwork */
  history: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=1400&q=80",

  /* Records — laptop and stethoscope on a desk */
  records: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80",

  /* Trends — doctors reviewing a scan on screen */
  trends: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1400&q=80",

  /* Doctor dashboard — doctor reviewing patient on tablet */
  doctorDash: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1400&q=80",

  /* Admin dashboard — medical team meeting around table */
  adminDash: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=1400&q=80",
};

/* Route → background photo (first match wins) */
const ROUTE_PHOTOS = [
  ["/patient/analyze",  PHOTOS.symptomChecker],
  ["/patient/results",  PHOTOS.results],
  ["/patient/history",  PHOTOS.records],
  ["/patient/trends",   PHOTOS.trends],
  ["/patient/chat",     PHOTOS.doctorDash],
  ["/patient",          PHOTOS.patientDash],
  ["/doctor/analysis",  PHOTOS.results],
  ["/doctor",           PHOTOS.doctorDash],
  ["/admin/diseases",   PHOTOS.results],
  ["/admin",            PHOTOS.adminDash],
  ["/login",            PHOTOS.login],
  ["/register",         PHOTOS.register],
];

export function photoForPath(pathname) {
  const hit = ROUTE_PHOTOS.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"));
  return hit ? hit[1] : PHOTOS.hero;
}
