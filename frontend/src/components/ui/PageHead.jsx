/** Page title block: eyebrow, title, one-line description, optional actions on the right. */
export default function PageHead({ eyebrow, title, subtitle, actions, back }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="flex items-end gap-3 min-w-0">
        {back}
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1 className="text-[30px] sm:text-[32px] font-bold leading-tight mt-1.5">{title}</h1>
          {subtitle && <p className="text-muted text-[15px] mt-1.5 max-w-xl">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
