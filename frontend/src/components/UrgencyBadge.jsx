import { useTranslation } from "react-i18next";
import { CheckCircle, AlertCircle, AlertTriangle, Zap } from "lucide-react";

const META = {
  low:       { cls: "urgency-low",       Icon: CheckCircle },
  moderate:  { cls: "urgency-moderate",  Icon: AlertCircle },
  high:      { cls: "urgency-high",      Icon: AlertTriangle },
  emergency: { cls: "urgency-emergency", Icon: Zap },
};

export default function UrgencyBadge({ level }) {
  const { t } = useTranslation();
  const key = META[level] ? level : "low";
  const { cls, Icon } = META[key];
  return <span className={cls}><Icon className="w-3 h-3" /> {t(`common.urgency.${key}`)}</span>;
}
