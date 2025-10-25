import {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

const cx = (...classes: Array<string | string[] | false | null | undefined>) =>
  classes
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .join(" ");

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
              {eyebrow ? <div className="terra-card-eyebrow">{eyebrow}</div> : null}
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

type TerraButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "tonal" | "link";
type TerraButtonSize = "sm" | "md" | "lg";

type TerraButtonProps = {
  variant?: TerraButtonVariant;
  size?: TerraButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  icon?: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  iconOnly?: boolean;
  children?: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function TerraButton({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  icon,
  isLoading = false,
  loadingText,
  fullWidth,
  iconOnly,
  children,
  className,
  disabled,
  type: typeAttr = "button",
  ...rest
}: TerraButtonProps) {
  const resolvedIconOnly = iconOnly ?? (!children && !!(leftIcon ?? rightIcon ?? icon));
  const contentLabel = isLoading && loadingText ? loadingText : children;
  const leadingIcon = isLoading ? <TerraSpinner className="terra-btn__spinner" /> : leftIcon ?? icon ?? null;
  const trailingIcon = isLoading ? null : rightIcon ?? null;
  const ariaBusy = isLoading ? true : undefined;

  return (
    <button
      type="button"
      className={cx(
        terraButtonClass({ variant, size, fullWidth, iconOnly: resolvedIconOnly }),
        className
      )}
      aria-busy={ariaBusy}
      disabled={disabled || isLoading}
      type={typeAttr}
      {...rest}
    >
      <span className="terra-btn__inner">
        {leadingIcon ? <span className="terra-btn__icon" aria-hidden="true">{leadingIcon}</span> : null}
        {contentLabel ? <span className="terra-btn__label">{contentLabel}</span> : null}
        {trailingIcon ? <span className="terra-btn__icon" aria-hidden="true">{trailingIcon}</span> : null}
      </span>
    </button>
  );
}

type TerraButtonClassOptions = {
  variant?: TerraButtonVariant;
  size?: TerraButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
};

const buttonVariantClassMap: Record<TerraButtonVariant, string[]> = {
  primary: ["terra-btn--primary", "terra-btn-primary"],
  secondary: ["terra-btn--secondary"],
  ghost: ["terra-btn--ghost", "terra-btn-ghost"],
  destructive: ["terra-btn--destructive"],
  tonal: ["terra-btn--tonal"],
  link: ["terra-btn--link"]
};

const buttonSizeClassMap: Record<TerraButtonSize, string> = {
  sm: "terra-btn--sm",
  md: "",
  lg: "terra-btn--lg"
};

export const terraButtonClass = (
  variantOrOptions: TerraButtonVariant | TerraButtonClassOptions = "primary",
  sizeOverride?: TerraButtonSize
) => {
  const options =
    typeof variantOrOptions === "string"
      ? ({ variant: variantOrOptions, size: sizeOverride } satisfies TerraButtonClassOptions)
      : variantOrOptions;

  const variant = options.variant ?? "primary";
  const size = options.size ?? "md";

  return cx(
    "terra-btn",
    buttonVariantClassMap[variant],
    buttonSizeClassMap[size],
    options.fullWidth ? "terra-btn--full" : "",
    options.iconOnly ? "terra-btn--icon" : ""
  );
};

function TerraSpinner({ className }: { className?: string }) {
  return <span className={cx("terra-spinner", className)} aria-hidden="true" />;
}

type TerraAlertProps = {
  tone?: "danger" | "warning" | "info" | "success";
  title?: string;
  children: ReactNode;
  className?: string;
};

export function TerraAlert({ tone = "info", title, children, className }: TerraAlertProps) {
  const toneClass = cx(
    "terra-alert",
    tone === "danger"
      ? "terra-alert--danger"
      : tone === "warning"
        ? "terra-alert--warning"
        : tone === "success"
          ? "terra-alert--success"
          : "terra-alert--info"
  );

  return (
    <div className={cx(toneClass, className)} role={tone === "danger" ? "alert" : undefined}>
      <div>
        {title ? <p className="font-heading text-display-md mb-1">{title}</p> : null}
        <div className="text-body-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

type TerraFieldProps = {
  label: ReactNode;
  htmlFor?: string;
  supportingText?: string;
  hint?: string;
  validationText?: string;
  status?: "default" | "error" | "success";
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function TerraField({
  label,
  htmlFor,
  supportingText,
  hint,
  validationText,
  status = "default",
  required = false,
  children,
  className
}: TerraFieldProps) {
  const helper = supportingText ?? hint ?? null;
  const hasStatus = status !== "default";
  return (
    <label
      className={cx("terra-field", className)}
      htmlFor={htmlFor}
      data-status={hasStatus ? status : undefined}
    >
      <div className="terra-field-header">
        <span className="terra-field-label">
          {label}
          {required ? <span className="terra-field-required" aria-hidden="true">*</span> : null}
        </span>
      </div>
      {children}
      {helper ? <span className="terra-field-supporting">{helper}</span> : null}
      {validationText ? <span className="terra-field-validation">{validationText}</span> : null}
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
      aria-label={label}
      disabled={disabled}
    >
      <span className="sr-only">{label}</span>
    </button>
  );
}

type TerraBadgeProps = {
  tone?: "success" | "neutral" | "warning" | "danger" | "info";
  children: ReactNode;
  className?: string;
};

export function TerraBadge({ tone = "neutral", children, className }: TerraBadgeProps) {
  return (
    <span className={cx("terra-badge", className)} data-tone={tone}>
      <span>{children}</span>
    </span>
  );
}

type TerraInputProps = InputHTMLAttributes<HTMLInputElement>;
type TerraSelectProps = SelectHTMLAttributes<HTMLSelectElement>;
type TerraTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TerraInput = forwardRef<HTMLInputElement, TerraInputProps>(function TerraInput(
  { className, type = "text", ...rest },
  ref
) {
  return <input ref={ref} type={type} className={cx("terra-input", className)} {...rest} />;
});

export const TerraSelect = forwardRef<HTMLSelectElement, TerraSelectProps>(function TerraSelect(
  { className, children, ...rest },
  ref
) {
  return (
    <select ref={ref} className={cx("terra-select", className)} {...rest}>
      {children}
    </select>
  );
});

export const TerraTextarea = forwardRef<HTMLTextAreaElement, TerraTextareaProps>(function TerraTextarea(
  { className, ...rest },
  ref
) {
  return <textarea ref={ref} className={cx("terra-textarea", className)} {...rest} />;
});

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
