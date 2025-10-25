import { ReactNode, ButtonHTMLAttributes, useEffect, useMemo, useRef, useState } from "react";

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

type TerraCardProps = {
  title?: string;
  eyebrow?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function TerraCard({ title, eyebrow, action, footer, children, className }: TerraCardProps) {
  return (
    <section className={cx("terra-card", className)}>
      <div className="terra-card-content">
        {(title || eyebrow || action) && (
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {eyebrow ? <div className="terra-badge">{eyebrow}</div> : null}
              {title ? (
                <h2 className="text-ink-900 text-display-md font-heading sm:text-display-lg">
                  {title}
                </h2>
              ) : null}
            </div>
            {action}
          </header>
        )}
        <div>{children}</div>
        {footer ? <footer className="pt-4 text-body-sm text-ink-500">{footer}</footer> : null}
      </div>
    </section>
  );
}

type TerraButtonProps = {
  variant?: "primary" | "ghost";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function TerraButton({ variant = "primary", icon, children, className, ...rest }: TerraButtonProps) {
  return (
    <button
      className={cx(
        terraButtonClass(variant),
        icon ? "gap-2" : "",
        className
      )}
      {...rest}
    >
      {icon ? <span className="text-base">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

export const terraButtonClass = (variant: "primary" | "ghost" = "primary") =>
  cx("terra-btn", variant === "primary" ? "terra-btn-primary" : "terra-btn-ghost");

type TerraAlertProps = {
  tone?: "danger" | "warning" | "info";
  title?: string;
  children: ReactNode;
  className?: string;
};

export function TerraAlert({ tone = "info", title, children, className }: TerraAlertProps) {
  const toneClass =
    tone === "danger"
      ? "terra-alert terra-alert--danger"
      : tone === "warning"
        ? "terra-alert terra-alert--warning"
        : "terra-alert terra-alert--info";

  return (
    <div className={cx(toneClass, className)}>
      <div>
        {title ? <p className="font-heading text-display-md mb-1">{title}</p> : null}
        <div className="text-body-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

type TerraFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function TerraField({ label, htmlFor, hint, children, className }: TerraFieldProps) {
  return (
    <label className={cx("flex flex-col gap-2", className)} htmlFor={htmlFor}>
      <span className="terra-field-label">{label}</span>
      {children}
      {hint ? <span className="text-body-sm text-ink-300">{hint}</span> : null}
    </label>
  );
}

type TerraToggleProps = {
  pressed: boolean;
  onPressedChange: () => void;
  disabled?: boolean;
  label: string;
};

export function TerraToggle({ pressed, onPressedChange, disabled, label }: TerraToggleProps) {
  return (
    <button
      type="button"
      className="terra-toggle"
      onClick={onPressedChange}
      aria-pressed={pressed}
      disabled={disabled}
    >
      <span className="sr-only">{label}</span>
    </button>
  );
}

type TerraBadgeProps = {
  tone?: "success" | "neutral" | "warning";
  children: ReactNode;
  className?: string;
};

export function TerraBadge({ tone = "neutral", children, className }: TerraBadgeProps) {
  const toneClass = useMemo(() => {
    if (tone === "success") {
      return "bg-[rgba(106,169,127,0.12)] text-[var(--terra-accent-verdant)]";
    }
    if (tone === "warning") {
      return "bg-[rgba(180,106,85,0.12)] text-[var(--terra-accent-clay)]";
    }
    return "bg-[rgba(46,59,69,0.08)] text-[var(--terra-ink-700)]";
  }, [tone]);

  return (
    <span className={cx("terra-badge", toneClass, className)}>
      <span>{children}</span>
    </span>
  );
}

type TerraKPIProps = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  format?:(value: number) => string;
  duration?: number;
};

export function TerraKPI({ label, value, prefix = "", suffix = "", format, duration = 600 }: TerraKPIProps) {
  const animated = useAnimatedNumber(value, duration);
  const display = format ? format(animated) : animated.toLocaleString(undefined, { maximumFractionDigits: 1 });

  return (
    <div className="terra-kpi">
      <span className="terra-kpi-label">{label}</span>
      <span className="terra-kpi-value" aria-live="polite">
        {prefix}
        {display}
        {suffix}
      </span>
    </div>
  );
}

type TerraSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function TerraLedgerSection({ title, description, children, action, className }: TerraSectionProps) {
  return (
    <section className={cx("terra-ledger-section", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4">
        <div>
          <h3 className="font-heading text-lg text-ink-900">{title}</h3>
          {description ? <p className="mt-1 text-body-sm text-ink-500">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="relative z-10 space-y-4">{children}</div>
    </section>
  );
}

function useAnimatedNumber(target: number, duration: number) {
  const [current, setCurrent] = useState(target);
  const previous = useRef(target);

  useEffect(() => {
    const from = previous.current;
    const diff = target - from;
    const start = performance.now();
    let frame: number;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(progress);
      setCurrent(from + diff * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);
    previous.current = target;

    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return current;
}

function easeOutCubic(t: number) {
  const p = 1 - Math.pow(1 - t, 3);
  return p;
}
