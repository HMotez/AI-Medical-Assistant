import { CheckCircle, AlertCircle, AlertTriangle, Zap } from "lucide-react";

/** Theme tone per urgency level (StatTile, bars). */
export const URGENCY_TONE = { emergency: "bad", high: "serious", moderate: "warn", low: "good" };

/**
 * Urgency banner: icon + gradient. The gradients are deep enough that the white
 * headline and the white subtitle stay readable on every level (≥ 4.5:1 across
 * the whole banner); the level is always written out, never color alone.
 */
export const URGENCY_META = {
  low:       { Icon: CheckCircle,   gradient: "linear-gradient(125deg, #16855a 0%, #0b6646 100%)" },
  moderate:  { Icon: AlertCircle,   gradient: "linear-gradient(125deg, #a06805 0%, #85520a 100%)" },
  high:      { Icon: AlertTriangle, gradient: "linear-gradient(125deg, #bb5418 0%, #9a3f10 100%)" },
  emergency: { Icon: Zap,           gradient: "linear-gradient(125deg, #d4372f 0%, #b3262c 55%, #7f1820 100%)" },
};
