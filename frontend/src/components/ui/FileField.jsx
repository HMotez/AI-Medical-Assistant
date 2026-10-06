import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Image as ImageIcon, Upload, CheckCircle } from "lucide-react";
import { formatSize } from "../../api/files";

export const DOCUMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

/** A document picker shown as a drop-style tile: label, hint, chosen file name and size. */
export default function FileField({ id, label, file, onChange, accept = DOCUMENT_ACCEPT, required = false }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const Icon = file ? (file.type === "application/pdf" ? FileText : ImageIcon) : Upload;
  return (
    <div>
      <span className="field-label">{label}{required && <span className="text-bad"> *</span>}</span>
      <label htmlFor={id}
        className={`flex items-center gap-3.5 rounded-[16px] border-2 border-dashed px-4 py-3.5 cursor-pointer transition-colors
          ${file ? "border-good/50 bg-good/5" : "border-line hover:border-accent/50 hover:bg-accent/5"}`}>
        <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${file ? "bg-good/15 text-good" : "bg-accent/12 text-accent"}`}>
          <Icon className="w-5 h-5" />
        </span>
        <span className="min-w-0 flex-1">
          {file ? (
            <>
              <span className="flex items-center gap-1.5 text-[14.5px] font-semibold text-ink truncate">
                <CheckCircle className="w-3.5 h-3.5 text-good shrink-0" /> <span className="truncate">{file.name}</span>
              </span>
              <span className="block text-[12.5px] text-muted">{formatSize(file.size)} · {t("register.replaceFile")}</span>
            </>
          ) : (
            <>
              <span className="block text-[14.5px] font-semibold text-accent">{t("register.chooseFile")}</span>
              <span className="block text-[12.5px] text-muted">{t("register.fileHint")}</span>
            </>
          )}
        </span>
        <input ref={inputRef} id={id} type="file" accept={accept} className="sr-only"
          onChange={(e) => { onChange(e.target.files?.[0] || null); e.target.value = ""; }} />
      </label>
    </div>
  );
}
