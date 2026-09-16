"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronDown,
  Database,
  Download,
  Leaf,
  Pencil,
  Plus,
  Scale,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { ShellMark } from "@/components/app/shell-mark";
import { Button } from "@/components/ui/button";
import {
  createMeasurement,
  createPet,
  clearAllLocalData,
  db,
  deleteMeasurement,
  deletePet,
  ensureDefaultData,
  updateMeasurement,
  updatePet,
} from "@/lib/db";
import {
  createSharedAccount,
  getSyncStatus,
  pullLatestSync,
  requestSync,
  signInToSync,
  syncNow,
} from "@/lib/sync/client";
import type { SyncStatus } from "@/lib/sync/types";
import type {
  LengthUnit,
  Measurement,
  Pet,
  PetDraft,
  PetSex,
  PetSpecies,
  WeightUnit,
} from "@/lib/domain";
import {
  gramToWeight,
  estimateAgeAtDate,
  isSignificantWeightDrop,
  lengthToMm,
  mmToLength,
  petSpecies,
  weightChangePercent,
  weightToGram,
} from "@/lib/domain";
import {
  downloadFile,
  makeBackup,
  measurementsToCsv,
  parseBackup,
  replaceWithBackup,
} from "@/lib/export";
import {
  formatAgeYears,
  formatCalendarDate,
  formatCalendarYear,
  formatChartDate,
  formatLength,
  formatMeasurementListDate,
  formatNumber,
  formatWeight,
} from "@/lib/i18n/format";
import { getMessages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

const messages = getMessages();
type View = "pets" | "data";

function today(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function optionalNumber(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return Number(value);
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-semibold text-primary">
      <span>
        {label}
        {hint ? (
          <span className="ml-2 font-normal text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "min-h-11 min-w-0 max-w-full w-full rounded-md border bg-white px-3 py-2 text-base font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

const seededPetPortraits: Record<string, string> = {
  "00000000-0000-4000-8000-000000000001": "/images/pets/debbie.png",
  "00000000-0000-4000-8000-000000000002": "/images/pets/jake.png",
  "59915277-c742-430c-aa98-09fe1b737b2b": "/images/pets/mochi.png",
};

function PetPortrait({
  photoDataUrl,
  petId,
  size = "regular",
}: {
  photoDataUrl?: string;
  petId?: string;
  size?: "small" | "regular" | "large";
}) {
  const sizeClass = {
    small: "size-11",
    regular: "size-16",
    large: "size-24",
  }[size];

  const source =
    photoDataUrl ?? seededPetPortraits[petId ?? ""] ?? "/images/pet-portrait-placeholder.png";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-[#d9ead6] shadow-[0_8px_22px_rgba(23,67,45,0.15)]",
        sizeClass,
      )}
    >
      <Image
        alt={messages.pet.photoPreview}
        className="object-cover"
        fill
        sizes={size === "large" ? "96px" : size === "regular" ? "64px" : "44px"}
        src={source}
        unoptimized={Boolean(photoDataUrl)}
      />
    </div>
  );
}

function SexIdentifier({
  sex,
  className,
  showUnknown = true,
}: {
  sex: PetSex;
  className?: string;
  showUnknown?: boolean;
}) {
  if (sex === "unknown") {
    return showUnknown ? <span className={className}>{messages.sex.unknown}</span> : null;
  }

  const colorClass = sex === "female" ? "text-[#c45a7a]" : "text-[#3f78aa]";

  return (
    <span
      aria-label={messages.sex[sex]}
      className={cn("inline-flex", colorClass, className)}
      title={messages.sex[sex]}
    >
      <span aria-hidden="true">{sex === "female" ? "♀" : "♂"}</span>
      <span className="sr-only">{messages.sex[sex]}</span>
    </span>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid overflow-hidden bg-primary/55 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <section
        aria-label={title}
        aria-modal="true"
        className="flex h-dvh w-full min-w-0 flex-col overflow-hidden bg-background shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-2xl sm:rounded-lg"
        role="dialog"
      >
        <header className="relative shrink-0 border-b bg-background px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:py-6">
          <h2 className="pr-12 font-display text-2xl font-bold text-primary sm:text-3xl">
            {title}
          </h2>
          {onClose ? (
            <Button
              aria-label={messages.common.cancel}
              className="absolute right-3 top-[max(0.5rem,env(safe-area-inset-top))] sm:right-6 sm:top-4"
              onClick={onClose}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="size-5" />
            </Button>
          ) : null}
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          {children}
        </div>
      </section>
    </div>
  );
}

function PetForm({ pet, onClose }: { pet?: Pet; onClose: () => void }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState(pet?.photoDataUrl);

  function choosePhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 4_000_000) {
      setError(messages.pet.photoError);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoDataUrl(reader.result);
        setError("");
      }
    };
    reader.onerror = () => setError(messages.pet.photoError);
    reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const draft: PetDraft = {
      name: String(data.get("name") ?? ""),
      species: String(data.get("species")) as PetSpecies,
      sex: String(data.get("sex")) as PetSex,
      birthDate: String(data.get("birthDate") || "") || undefined,
      estimatedAgeYears: optionalNumber(data.get("estimatedAgeYears")),
      photoDataUrl,
      notes: String(data.get("notes") || "") || undefined,
    };
    try {
      if (pet) await updatePet(pet.id, draft);
      else await createPet(draft);
      onClose();
    } catch {
      setError(messages.validation.saveFailed);
      setSaving(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={pet ? messages.pet.editHeading : messages.pet.newHeading}
    >
      <form className="mt-6 grid gap-5" onSubmit={submit}>
        <Field label={messages.pet.name}>
          <input
            className={inputClass}
            defaultValue={pet?.name}
            name="name"
            required
          />
        </Field>
        <section className="rounded-lg border bg-gradient-to-br from-emerald-50 via-card to-amber-50/70 p-4">
          <div className="flex items-center gap-4">
            <PetPortrait photoDataUrl={photoDataUrl} petId={pet?.id} size="regular" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">
                {messages.pet.photo}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {messages.pet.photoHelp}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex min-h-10 cursor-pointer items-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                  <input
                    accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => choosePhoto(event.target.files?.[0])}
                    type="file"
                  />
                  {photoDataUrl
                    ? messages.pet.replacePhoto
                    : messages.pet.addPhoto}
                </label>
                {photoDataUrl ? (
                  <Button
                    onClick={() => setPhotoDataUrl(undefined)}
                    type="button"
                    variant="outline"
                  >
                    {messages.pet.removePhoto}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </section>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={messages.pet.species}>
            <select
              className={inputClass}
              defaultValue={pet?.species ?? "other"}
              name="species"
            >
              {petSpecies.map((species) => (
                <option key={species} value={species}>
                  {messages.species[species]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={messages.pet.sex}>
            <select
              className={inputClass}
              defaultValue={pet?.sex ?? "unknown"}
              name="sex"
            >
              {(["unknown", "female", "male"] as const).map((sex) => (
                <option key={sex} value={sex}>
                  {messages.sex[sex]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={messages.pet.birthDate} hint={messages.common.optional}>
            <input
              className={cn(inputClass, "date-input")}
              defaultValue={pet?.birthDate}
              name="birthDate"
              type="date"
            />
          </Field>
          <Field
            label={messages.pet.estimatedAge}
            hint={messages.common.optional}
          >
            <div className="flex items-center gap-3">
              <input
                className={inputClass}
                defaultValue={pet?.estimatedAgeYears}
                min="0"
                name="estimatedAgeYears"
                step="0.1"
                type="number"
              />
              <span className="text-sm font-normal text-muted-foreground">
                {messages.pet.years}
              </span>
            </div>
          </Field>
        </div>
        <Field label={messages.pet.notes} hint={messages.common.optional}>
          <textarea
            className={inputClass}
            defaultValue={pet?.notes}
            name="notes"
            rows={3}
          />
        </Field>
        {error ? (
          <p className="text-sm font-medium text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
          <Button onClick={onClose} type="button" variant="outline">
            {messages.common.cancel}
          </Button>
          <Button disabled={saving} type="submit">
            {messages.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function MeasurementForm({
  petId,
  measurement,
  onClose,
}: {
  petId: string;
  measurement?: Measurement;
  onClose: () => void;
}) {
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("g");
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("mm");
  const [weightInput, setWeightInput] = useState(() =>
    measurement ? String(gramToWeight(measurement.weightGram, "g")) : "",
  );
  const [dateInput, setDateInput] = useState(
    measurement?.measuredAt ?? today(),
  );
  const [dimensionInputs, setDimensionInputs] = useState(() => ({
    shellLength:
      measurement?.shellLengthMm === undefined
        ? ""
        : String(mmToLength(measurement.shellLengthMm, "mm")),
    shellWidth:
      measurement?.shellWidthMm === undefined
        ? ""
        : String(mmToLength(measurement.shellWidthMm, "mm")),
    shellHeight:
      measurement?.shellHeightMm === undefined
        ? ""
        : String(mmToLength(measurement.shellHeightMm, "mm")),
  }));
  const [notesInput, setNotesInput] = useState(measurement?.notes ?? "");
  const [dimensionsOpen, setDimensionsOpen] = useState(
    Boolean(
      measurement?.shellLengthMm ??
        measurement?.shellWidthMm ??
        measurement?.shellHeightMm,
    ),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function changeWeightUnit(nextUnit: WeightUnit) {
    const value = Number(weightInput);
    if (weightInput !== "" && Number.isFinite(value)) {
      setWeightInput(
        String(gramToWeight(weightToGram(value, weightUnit), nextUnit)),
      );
    }
    setWeightUnit(nextUnit);
  }

  function changeLengthUnit(nextUnit: LengthUnit) {
    const convert = (value: string) => {
      const number = Number(value);
      return value === "" || !Number.isFinite(number)
        ? value
        : String(mmToLength(lengthToMm(number, lengthUnit), nextUnit));
    };
    setDimensionInputs((current) => ({
      shellLength: convert(current.shellLength),
      shellWidth: convert(current.shellWidth),
      shellHeight: convert(current.shellHeight),
    }));
    setLengthUnit(nextUnit);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const weight = Number(weightInput);
    const dimension = (name: keyof typeof dimensionInputs) => {
      const value = optionalNumber(dimensionInputs[name]);
      return value === undefined ? undefined : lengthToMm(value, lengthUnit);
    };
    const draft = {
      petId,
      measuredAt: dateInput,
      weightGram: weightToGram(weight, weightUnit),
      shellLengthMm: dimension("shellLength"),
      shellWidthMm: dimension("shellWidth"),
      shellHeightMm: dimension("shellHeight"),
      notes: notesInput.trim() || undefined,
    };
    try {
      if (measurement) await updateMeasurement(measurement.id, draft);
      else await createMeasurement(draft);
      onClose();
    } catch {
      setError(messages.validation.saveFailed);
      setSaving(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={
        measurement
          ? messages.measurement.editHeading
          : messages.measurement.newHeading
      }
    >
      <form className="mt-6 grid min-w-0 gap-5" onSubmit={submit}>
        <Field label={messages.measurement.date}>
          <input
            className={cn(inputClass, "date-input")}
            name="measuredAt"
            onChange={(event) => setDateInput(event.target.value)}
            required
            type="date"
            value={dateInput}
          />
        </Field>

        <Field label={messages.measurement.weight}>
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_5.5rem] gap-3">
            <input
              className={inputClass}
              inputMode="decimal"
              min="0.001"
              name="weight"
              onChange={(event) => setWeightInput(event.target.value)}
              required
              step="any"
              type="number"
              value={weightInput}
            />
            <select
              aria-label={messages.measurement.weightUnit}
              className={inputClass}
              onChange={(event) =>
                changeWeightUnit(event.target.value as WeightUnit)
              }
              value={weightUnit}
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </Field>

        <details
          className="min-w-0 overflow-hidden rounded-md border bg-muted/40"
          onToggle={(event) => setDimensionsOpen(event.currentTarget.open)}
          open={dimensionsOpen}
        >
          <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-3 font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
            <span>{messages.measurement.dimensions}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {messages.common.optional}
            </span>
          </summary>
          <div className="grid min-w-0 gap-4 border-t p-4">
            <Field label={messages.measurement.lengthUnit}>
              <select
                className={inputClass}
                onChange={(event) =>
                  changeLengthUnit(event.target.value as LengthUnit)
                }
                value={lengthUnit}
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
              </select>
            </Field>
            <div className="grid min-w-0 gap-4 sm:grid-cols-3">
              {(
                [
                  ["shellLength", messages.measurement.shellLength],
                  ["shellWidth", messages.measurement.shellWidth],
                  ["shellHeight", messages.measurement.shellHeight],
                ] as const
              ).map(([name, label]) => (
                <Field key={name} label={label}>
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    min="0.001"
                    onChange={(event) =>
                      setDimensionInputs((current) => ({
                        ...current,
                        [name]: event.target.value,
                      }))
                    }
                    step="any"
                    type="number"
                    value={dimensionInputs[name]}
                  />
                </Field>
              ))}
            </div>
          </div>
        </details>

        <Field
          label={messages.measurement.notes}
          hint={messages.common.optional}
        >
          <textarea
            className={cn(inputClass, "min-h-32 resize-y")}
            onChange={(event) => setNotesInput(event.target.value)}
            rows={4}
            value={notesInput}
          />
        </Field>

        {error ? (
          <p className="text-sm font-medium text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
          <Button onClick={onClose} type="button" variant="outline">
            {messages.common.cancel}
          </Button>
          <Button disabled={saving} type="submit">
            {messages.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Confirm({
  title,
  body,
  action,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  action: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} title={title}>
      <p className="mt-4 leading-7 text-muted-foreground">{body}</p>
      <div className="mt-7 flex flex-wrap justify-end gap-3">
        <Button onClick={onClose} variant="outline">
          {messages.common.cancel}
        </Button>
        <Button
          className="bg-red-800 hover:bg-red-900"
          onClick={async () => {
            await onConfirm();
            onClose();
          }}
        >
          {action}
        </Button>
      </div>
    </Modal>
  );
}

function niceWeightTicks(values: number[], targetTickCount = 4): number[] {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const rawStep = Math.max((maximum - minimum) / targetTickCount, 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / magnitude;
  const niceFraction =
    fraction <= 1
      ? 1
      : fraction <= 2
        ? 2
        : fraction <= 2.5
          ? 2.5
          : fraction <= 5
            ? 5
            : 10;
  const step = niceFraction * magnitude;
  const padding = (maximum - minimum || maximum || 1) * 0.08;
  const niceMinimum = Math.max(
    0,
    Math.floor((minimum - padding) / step) * step,
  );
  const niceMaximum = Math.ceil((maximum + padding) / step) * step;
  const ticks: number[] = [];
  for (
    let value = niceMinimum;
    value <= niceMaximum + step / 2;
    value += step
  ) {
    ticks.push(value);
  }
  return ticks;
}

type ChartRange = "all" | "year" | "sixMonths" | "threeMonths";

const chartRanges: ReadonlyArray<{ value: ChartRange; days?: number }> = [
  { value: "all" },
  { value: "year", days: 365 },
  { value: "sixMonths", days: 183 },
  { value: "threeMonths", days: 92 },
];

export function WeightChart({ measurements }: { measurements: Measurement[] }) {
  const [range, setRange] = useState<ChartRange>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(680);
  const chartContainer = useRef<HTMLDivElement>(null);
  const chartSvg = useRef<SVGSVGElement>(null);
  const ordered = useMemo(
    () => [...measurements].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt)),
    [measurements],
  );
  const visibleMeasurements = useMemo(() => {
    const selectedRange = chartRanges.find((item) => item.value === range);
    if (!selectedRange?.days || !ordered.length) return ordered;
    const latest = Date.parse(
      ordered[ordered.length - 1].measuredAt + "T00:00:00.000Z",
    );
    const earliest = latest - selectedRange.days * 24 * 60 * 60 * 1000;
    const filtered = ordered.filter(
      (measurement) =>
        Date.parse(measurement.measuredAt + "T00:00:00.000Z") >= earliest,
    );
    return filtered.length >= 2 ? filtered : ordered;
  }, [ordered, range]);

  useEffect(() => {
    const container = chartContainer.current;
    if (!container) return;
    const updateWidth = () => setContainerWidth(container.clientWidth);
    updateWidth();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setActiveIndex(Math.max(visibleMeasurements.length - 1, 0));
  }, [range, visibleMeasurements.length]);

  if (visibleMeasurements.length < 2) return null;

  const chartWidth = Math.max(containerWidth, 320);
  const chartHeight = chartWidth < 480 ? 278 : 310;
  const margin = {
    top: 18,
    right: chartWidth < 480 ? 16 : 28,
    bottom: 54,
    left: chartWidth < 480 ? 58 : 76,
  };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;
  const weights = visibleMeasurements.map((item) => item.weightGram);
  const yTicks = niceWeightTicks(weights);
  const yMinimum = yTicks[0];
  const yMaximum = yTicks[yTicks.length - 1];
  const yRange = yMaximum - yMinimum || 1;
  const dateValues = visibleMeasurements.map((item) =>
    Date.parse(item.measuredAt + "T00:00:00.000Z"),
  );
  const dateMinimum = dateValues[0];
  const dateRange = dateValues[dateValues.length - 1] - dateMinimum || 1;
  const weightUnit = yMaximum >= 1000 ? "kg" : "g";
  const points = visibleMeasurements.map((measurement, index) => {
    const x = margin.left + ((dateValues[index] - dateMinimum) / dateRange) * plotWidth;
    const y = margin.top + (1 - (measurement.weightGram - yMinimum) / yRange) * plotHeight;
    const previous = visibleMeasurements[index - 1];
    return {
      measurement,
      x,
      y,
      changePercent: previous
        ? weightChangePercent(previous.weightGram, measurement.weightGram)
        : 0,
      significantDrop: previous
        ? isSignificantWeightDrop(previous.weightGram, measurement.weightGram)
        : false,
    };
  });
  const linePath = points
    .map((point, index) => (index === 0 ? "M " : "L ") + point.x + " " + point.y)
    .join(" ");
  const baseline = margin.top + plotHeight;
  const areaPath =
    linePath +
    " L " +
    points[points.length - 1].x +
    " " +
    baseline +
    " L " +
    points[0].x +
    " " +
    baseline +
    " Z";
  const labelCount = chartWidth < 480 ? 3 : 4;
  const dateLabelIndexes = Array.from(
    new Set(
      Array.from({ length: labelCount }, (_, index) =>
        Math.round((index * (visibleMeasurements.length - 1)) / (labelCount - 1)),
      ),
    ),
  );
  const markerIndexes = new Set([0, points.length - 1]);
  points.forEach((point, index) => {
    if (point.significantDrop) markerIndexes.add(index);
  });
  const activePoint = points[Math.min(activeIndex, points.length - 1)];
  const tooltipWidth = 142;
  const tooltipHeight = activePoint.significantDrop ? 62 : 48;
  const tooltipX = Math.min(
    chartWidth - margin.right - tooltipWidth,
    Math.max(margin.left, activePoint.x - tooltipWidth / 2),
  );
  const tooltipY =
    activePoint.y - tooltipHeight - 12 >= margin.top
      ? activePoint.y - tooltipHeight - 12
      : activePoint.y + 12;

  function selectNearestRecord(clientX: number) {
    const svg = chartSvg.current;
    if (!svg) return;
    const bounds = svg.getBoundingClientRect();
    const svgX = ((clientX - bounds.left) / bounds.width) * chartWidth;
    const targetX = Math.min(chartWidth - margin.right, Math.max(margin.left, svgX));
    const nearest = points.reduce(
      (closest, point, index) =>
        Math.abs(point.x - targetX) < closest.distance
          ? { index, distance: Math.abs(point.x - targetX) }
          : closest,
      { index: 0, distance: Number.POSITIVE_INFINITY },
    );
    setActiveIndex(nearest.index);
  }

  function handleChartKeyDown(event: KeyboardEvent<SVGRectElement>) {
    let nextIndex = activeIndex;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      nextIndex = Math.max(0, activeIndex - 1);
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      nextIndex = Math.min(points.length - 1, activeIndex + 1);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = points.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    setActiveIndex(nextIndex);
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border bg-card shadow-ambient">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="font-display text-xl font-bold text-primary">
              {messages.pet.chart}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {messages.pet.chartDescription}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-primary" />
              {messages.pet.chartLegendRecorded}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-red-700" />
              {messages.pet.chartLegendDrop}
            </span>
          </div>
        </div>
        <div
          aria-label={messages.pet.chartRangeLabel}
          className="mt-5 flex flex-wrap gap-2"
          role="group"
        >
          {chartRanges.map(({ value }) => (
            <Button
              className="h-9 px-3 text-xs"
              key={value}
              onClick={() => setRange(value)}
              type="button"
              variant={range === value ? "default" : "outline"}
            >
              {messages.pet.chartRanges[value]}
            </Button>
          ))}
        </div>
        <div className="mt-4 grid gap-1 rounded-md bg-muted/55 px-3 py-2 text-sm sm:grid-cols-[auto_1fr] sm:items-center sm:gap-3">
          <span className="font-semibold text-primary">
            {messages.pet.chartSelected}
          </span>
          <span className="min-w-0 text-muted-foreground">
            {formatCalendarDate(activePoint.measurement.measuredAt)} ·{" "}
            {formatWeight(activePoint.measurement.weightGram, "g")}
            {activePoint.significantDrop
              ? " (" +
                formatNumber(activePoint.changePercent, {
                  maximumFractionDigits: 1,
                }) +
                "%)"
              : ""}
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {messages.pet.chartExploreHint}
        </p>
      </div>

      <div
        className="relative min-w-0 border-t bg-gradient-to-b from-muted/25 to-card"
        ref={chartContainer}
      >
        <svg
          aria-label={messages.pet.chart}
          className="block h-[278px] w-full touch-none select-none sm:h-[310px]"
          ref={chartSvg}
          role="group"
          viewBox={"0 0 " + chartWidth + " " + chartHeight}
        >
          <defs>
            <linearGradient id="weightArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.22" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {yTicks.map((tick) => {
            const y = margin.top + (1 - (tick - yMinimum) / yRange) * plotHeight;
            return (
              <line className="stroke-border/70" key={tick} strokeDasharray="3 5" x1={margin.left} x2={chartWidth - margin.right} y1={y} y2={y} />
            );
          })}
          {dateLabelIndexes.map((index) => {
            const point = points[index];
            return (
              <g key={point.measurement.id}>
                <line className="stroke-border/50" x1={point.x} x2={point.x} y1={baseline} y2={baseline + 5} />
                <text
                  className="fill-muted-foreground text-[11px]"
                  textAnchor={index === 0 ? "start" : index === visibleMeasurements.length - 1 ? "end" : "middle"}
                  x={point.x}
                  y={baseline + 21}
                >
                  {formatChartDate(point.measurement.measuredAt)}
                </text>
              </g>
            );
          })}
          <text
            className="fill-muted-foreground text-[11px] font-semibold"
            textAnchor="middle"
            x={margin.left + plotWidth / 2}
            y={chartHeight - 8}
          >
            {messages.pet.chartDateAxis}
          </text>
          <path className="chart-area" d={areaPath} fill="url(#weightArea)" />
          <path className="chart-line fill-none stroke-primary" d={linePath} pathLength="1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
          {points.map((point, index) => {
            if (!point.significantDrop || index === 0) return null;
            const previous = points[index - 1];
            return <line className="chart-line stroke-red-700" key={"drop-" + point.measurement.id} pathLength="1" strokeLinecap="round" strokeWidth="3.5" x1={previous.x} x2={point.x} y1={previous.y} y2={point.y} />;
          })}
          {points.map((point, index) =>
            markerIndexes.has(index) ? (
              <circle
                aria-hidden="true"
                className={cn("chart-point pointer-events-none stroke-card stroke-2", point.significantDrop ? "fill-red-700" : "fill-primary")}
                cx={point.x}
                cy={point.y}
                key={point.measurement.id}
                r={point.significantDrop ? 4.5 : 3.5}
              />
            ) : null,
          )}
          <rect
            aria-label={messages.pet.chartExploreHint}
            aria-valuemax={points.length}
            aria-valuemin={1}
            aria-valuenow={activeIndex + 1}
            aria-valuetext={formatCalendarDate(activePoint.measurement.measuredAt) + ", " + formatWeight(activePoint.measurement.weightGram, "g")}
            className="cursor-crosshair fill-transparent outline-none focus:stroke-primary/35"
            height={plotHeight}
            onKeyDown={handleChartKeyDown}
            onPointerDown={(event) => selectNearestRecord(event.clientX)}
            onPointerMove={(event) => selectNearestRecord(event.clientX)}
            role="slider"
            tabIndex={0}
            width={plotWidth}
            x={margin.left}
            y={margin.top}
          />
          <line aria-hidden="true" className="pointer-events-none stroke-secondary/45" strokeDasharray="3 4" x1={activePoint.x} x2={activePoint.x} y1={margin.top} y2={baseline} />
          <circle
            aria-hidden="true"
            className={cn("pointer-events-none stroke-card stroke-[3]", activePoint.significantDrop ? "fill-red-700" : "fill-primary")}
            cx={activePoint.x}
            cy={activePoint.y}
            r="6"
          />
          <g className="pointer-events-none" transform={"translate(" + tooltipX + " " + tooltipY + ")"}>
            <rect fill="hsl(var(--primary))" height={tooltipHeight} rx="8" width={tooltipWidth} />
            <text fill="hsl(var(--primary-foreground))" fontSize="11" x="12" y="19">
              {formatCalendarDate(activePoint.measurement.measuredAt)}
            </text>
            <text fill="hsl(var(--primary-foreground))" fontSize="13" fontWeight="700" x="12" y="38">
              {formatWeight(activePoint.measurement.weightGram, "g")}
            </text>
            {activePoint.significantDrop ? (
              <text fill="#fecaca" fontSize="11" fontWeight="600" x="12" y="54">
                {formatNumber(activePoint.changePercent, { maximumFractionDigits: 1 })}%
              </text>
            ) : null}
          </g>
        </svg>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-[278px] w-full sm:h-[310px]"
          viewBox={"0 0 " + chartWidth + " " + chartHeight}
        >
          {yTicks.map((tick) => {
            const y = margin.top + (1 - (tick - yMinimum) / yRange) * plotHeight;
            return (
              <text className="fill-muted-foreground text-[11px]" key={tick} textAnchor="end" x={margin.left - 10} y={y + 4}>
                {formatWeight(tick, weightUnit)}
              </text>
            );
          })}
          <text
            className="fill-muted-foreground text-[11px] font-semibold"
            textAnchor="middle"
            transform={"rotate(-90 16 " + (margin.top + plotHeight / 2) + ")"}
            x={16}
            y={margin.top + plotHeight / 2}
          >
            {weightUnit === "kg" ? messages.pet.chartWeightAxisKilogram : messages.pet.chartWeightAxisGram}
          </text>
        </svg>
      </div>
    </section>
  );
}

function PetDetail({ petId, onBack }: { petId: string; onBack: () => void }) {
  const pet = useLiveQuery(() => db.pets.get(petId), [petId]);
  const measurements =
    useLiveQuery(
      () => db.measurements.where("petId").equals(petId).sortBy("measuredAt"),
      [petId],
    ) ?? [];
  const [petEditor, setPetEditor] = useState(false);
  const [measurementEditor, setMeasurementEditor] = useState<
    Measurement | "new" | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Pet | Measurement | null>(
    null,
  );
  const [expandedMeasurementId, setExpandedMeasurementId] = useState<string>();
  if (!pet) return null;
  const ordered = [...measurements].reverse();
  const chronological = [...measurements].sort((a, b) =>
    a.measuredAt.localeCompare(b.measuredAt),
  );
  const changesByMeasurementId = new Map<
    string,
    { percent: number; significantDrop: boolean }
  >();
  chronological.forEach((measurement, index) => {
    const previous = chronological[index - 1];
    if (!previous) return;
    changesByMeasurementId.set(measurement.id, {
      percent: weightChangePercent(previous.weightGram, measurement.weightGram),
      significantDrop: isSignificantWeightDrop(
        previous.weightGram,
        measurement.weightGram,
      ),
    });
  });
  const measurementGroups: Array<{ year: string; records: Measurement[] }> = [];
  ordered.forEach((measurement) => {
    const year = formatCalendarYear(measurement.measuredAt);
    const currentGroup = measurementGroups[measurementGroups.length - 1];
    if (currentGroup?.year === year) currentGroup.records.push(measurement);
    else measurementGroups.push({ year, records: [measurement] });
  });
  const latest = ordered[0];
  const first = measurements[0];
  const estimatedAge =
    latest && first && pet.estimatedAgeYears !== undefined
      ? estimateAgeAtDate(
          pet.estimatedAgeYears,
          first.measuredAt,
          latest.measuredAt,
        )
      : undefined;
  return (
    <main className="min-w-0 flex-1 px-5 pb-28 pt-8 sm:px-8 lg:pb-10 lg:pt-10">
      <div className="mx-auto max-w-5xl">
        <Button className="-ml-3 mb-6" onClick={onBack} variant="ghost">
          <ArrowLeft className="mr-2 size-4" />
          {messages.pet.back}
        </Button>
        <header className="tember-hero flex flex-col justify-between gap-5 rounded-2xl p-5 sm:flex-row sm:items-start sm:p-7">
          <div className="flex items-center gap-4">
            <PetPortrait photoDataUrl={pet.photoDataUrl} petId={pet.id} size="regular" />
            <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
              {messages.species[pet.species]}
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold text-primary">
              {pet.name}
            </h1>
            <p className="mt-2 text-2xl leading-none text-muted-foreground">
              <SexIdentifier sex={pet.sex} />
            </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setMeasurementEditor("new")}>
              <Plus className="mr-2 size-4" />
              {messages.pet.addMeasurement}
            </Button>
            <Button
              aria-label={messages.common.edit}
              onClick={() => setPetEditor(true)}
              variant="outline"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              aria-label={messages.common.delete}
              onClick={() => setDeleteTarget(pet)}
              variant="outline"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </header>
        {latest ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl bg-gradient-to-br from-primary to-[#1f6b49] p-6 text-primary-foreground shadow-[0_16px_30px_rgba(21,73,46,0.18)] sm:col-span-2">
              <p className="text-sm opacity-75">{messages.pet.latestWeight}</p>
              <p className="mt-2 font-display text-4xl font-bold">
                {formatWeight(latest.weightGram, "g")}
              </p>
              <p className="mt-2 text-sm opacity-75">
                {formatCalendarDate(latest.measuredAt)}
              </p>
            </article>
            <article className="tember-stat-card rounded-2xl border bg-card/90 p-6">
              <p className="text-sm text-muted-foreground">
                {messages.dashboard.measurementCount}
              </p>
              <p className="mt-2 font-display text-4xl font-bold text-primary">
                {formatNumber(measurements.length)}
              </p>
            </article>
            <article className="tember-stat-card rounded-2xl border bg-card/90 p-6">
              <p className="text-sm text-muted-foreground">
                {messages.pet.estimatedAgeLatest}
              </p>
              <p className="mt-2 font-display text-2xl font-bold text-primary">
                {estimatedAge === undefined
                  ? messages.common.notRecorded
                  : formatAgeYears(estimatedAge)}
              </p>
            </article>
          </div>
        ) : (
          <section className="mt-8 rounded-lg border border-dashed bg-card p-8 text-center">
            <Scale className="mx-auto size-8 text-secondary" />
            <h2 className="mt-4 font-display text-xl font-bold">
              {messages.pet.noMeasurements}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {messages.pet.noMeasurementsBody}
            </p>
          </section>
        )}
        <div className="mt-6">
          <WeightChart measurements={measurements} />
        </div>
        {ordered.length ? (
          <section className="mt-6 min-w-0 max-w-full overflow-hidden rounded-lg border bg-card shadow-ambient">
            <div className="border-b px-5 py-4">
              <h2 className="font-display text-xl font-bold text-primary">
                {messages.pet.history}
              </h2>
            </div>
            <div className="md:hidden">
              {measurementGroups.map((group) => (
                <section key={group.year}>
                  <h3 className="sticky top-0 z-10 border-y bg-muted/95 px-4 py-2 text-xs font-bold tracking-wide text-muted-foreground backdrop-blur">
                    {group.year}
                  </h3>
                  <div className="divide-y">
                    {group.records.map((item) => {
                      const expanded = expandedMeasurementId === item.id;
                      const change = changesByMeasurementId.get(item.id);
                      const dimensions = [
                        {
                          label: messages.measurement.shellLength,
                          value: item.shellLengthMm,
                        },
                        {
                          label: messages.measurement.shellWidth,
                          value: item.shellWidthMm,
                        },
                        {
                          label: messages.measurement.shellHeight,
                          value: item.shellHeightMm,
                        },
                      ].filter((dimension) => dimension.value !== undefined);

                      return (
                        <article key={item.id}>
                          <button
                            aria-expanded={expanded}
                            className="grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto_3.75rem_1.25rem] items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                            onClick={() =>
                              setExpandedMeasurementId(
                                expanded ? undefined : item.id,
                              )
                            }
                            type="button"
                          >
                            <span className="min-w-0 font-medium">
                              {formatMeasurementListDate(item.measuredAt)}
                            </span>
                            <span className="whitespace-nowrap font-display text-sm font-bold text-primary">
                              {formatWeight(item.weightGram, "g")}
                            </span>
                            <span
                              className={cn(
                                "text-right text-xs font-semibold tabular-nums",
                                change?.significantDrop
                                  ? "text-red-700"
                                  : "text-muted-foreground",
                              )}
                            >
                              <span className="sr-only">
                                {messages.measurement.changeFromPrevious}
                              </span>
                              <span>
                                {change
                                  ? formatNumber(change.percent / 100, {
                                      maximumFractionDigits: 1,
                                      signDisplay: "always",
                                      style: "percent",
                                    })
                                  : messages.common.notRecordedShort}
                              </span>
                            </span>
                            <span className="sr-only">
                              {expanded
                                ? messages.measurement.hideDetails
                                : messages.measurement.showDetails}
                            </span>
                            <ChevronDown
                              aria-hidden="true"
                              className={cn(
                                "size-5 text-muted-foreground transition-transform",
                                expanded && "rotate-180",
                              )}
                            />
                          </button>

                          {expanded ? (
                            <div className="border-t bg-muted/25 px-4 pb-4 pt-3">
                              {dimensions.length ? (
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                                  {dimensions.map((dimension) => (
                                    <div key={dimension.label}>
                                      <dt className="text-xs text-muted-foreground">
                                        {dimension.label}
                                      </dt>
                                      <dd className="mt-1 text-sm font-medium">
                                        {dimension.value === undefined
                                          ? null
                                          : formatLength(dimension.value, "mm")}
                                      </dd>
                                    </div>
                                  ))}
                                </dl>
                              ) : null}

                              {item.notes ? (
                                <div
                                  className={cn(dimensions.length && "mt-3")}
                                >
                                  <p className="text-xs text-muted-foreground">
                                    {messages.measurement.notes}
                                  </p>
                                  <p className="mt-1 text-sm leading-6">
                                    {item.notes}
                                  </p>
                                </div>
                              ) : null}

                              <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                                <Button
                                  onClick={() => setMeasurementEditor(item)}
                                  variant="ghost"
                                >
                                  <Pencil className="size-4" />
                                  {messages.common.edit}
                                </Button>
                                <Button
                                  onClick={() => setDeleteTarget(item)}
                                  variant="ghost"
                                >
                                  <Trash2 className="size-4" />
                                  {messages.common.delete}
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <div className="hidden min-w-0 max-w-full overflow-x-auto overscroll-x-contain md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-muted/70 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">{messages.measurement.date}</th>
                    <th className="px-5 py-3">{messages.measurement.weight}</th>
                    <th className="px-5 py-3">
                      {messages.measurement.shellLength}
                    </th>
                    <th className="px-5 py-3">
                      {messages.measurement.shellWidth}
                    </th>
                    <th className="px-5 py-3">
                      {messages.measurement.shellHeight}
                    </th>
                    <th className="sticky right-0 bg-muted px-5 py-3 shadow-[-8px_0_16px_rgba(27,48,34,0.05)]">
                      <span className="sr-only">{messages.common.edit}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ordered.map((item) => (
                    <tr className="border-t" key={item.id}>
                      <td className="px-5 py-4 font-medium">
                        {formatCalendarDate(item.measuredAt)}
                      </td>
                      <td className="px-5 py-4">
                        {formatWeight(item.weightGram, "g")}
                      </td>
                      {(
                        [
                          item.shellLengthMm,
                          item.shellWidthMm,
                          item.shellHeightMm,
                        ] as const
                      ).map((value, index) => (
                        <td
                          className="px-5 py-4 text-muted-foreground"
                          key={index}
                        >
                          {value === undefined
                            ? messages.common.notRecordedShort
                            : formatLength(value, "mm")}
                        </td>
                      ))}
                      <td className="sticky right-0 bg-card px-5 py-4 shadow-[-8px_0_16px_rgba(27,48,34,0.05)]">
                        <div className="flex justify-end gap-1">
                          <Button
                            aria-label={messages.common.edit}
                            onClick={() => setMeasurementEditor(item)}
                            size="icon"
                            variant="ghost"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            aria-label={messages.common.delete}
                            onClick={() => setDeleteTarget(item)}
                            size="icon"
                            variant="ghost"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
      {petEditor ? (
        <PetForm onClose={() => setPetEditor(false)} pet={pet} />
      ) : null}
      {measurementEditor ? (
        <MeasurementForm
          measurement={
            measurementEditor === "new" ? undefined : measurementEditor
          }
          onClose={() => setMeasurementEditor(null)}
          petId={petId}
        />
      ) : null}
      {deleteTarget ? (
        <Confirm
          action={
            "petId" in deleteTarget
              ? messages.measurement.deleteConfirm
              : messages.pet.deleteConfirm
          }
          body={
            "petId" in deleteTarget
              ? messages.measurement.deleteBody
              : messages.pet.deleteBody
          }
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            if ("petId" in deleteTarget)
              await deleteMeasurement(deleteTarget.id);
            else {
              await deletePet(deleteTarget.id);
              onBack();
            }
          }}
          title={
            "petId" in deleteTarget
              ? messages.measurement.deleteHeading
              : messages.pet.deleteHeading
          }
        />
      ) : null}
    </main>
  );
}

function PetList({
  onOpen,
  storageReady,
}: {
  onOpen: (id: string) => void;
  storageReady: boolean;
}) {
  const pets = useLiveQuery(() =>
    db.pets.orderBy("updatedAt").reverse().toArray(),
  );
  const measurements = useLiveQuery(() => db.measurements.toArray());
  const [editing, setEditing] = useState(false);
  const loading =
    !storageReady || pets === undefined || measurements === undefined;
  return (
    <main className="min-w-0 flex-1 px-5 pb-28 pt-8 sm:px-8 lg:pb-10 lg:pt-10">
      <div className="mx-auto max-w-5xl">
        <header className="tember-hero flex flex-col justify-between gap-5 rounded-2xl p-5 sm:flex-row sm:items-end sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
              {messages.dashboard.eyebrow}
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold text-primary">
              {messages.dashboard.heading}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {messages.dashboard.introduction}
            </p>
          </div>
          <Button onClick={() => setEditing(true)}>
            <Plus className="mr-2 size-4" />
            {messages.dashboard.addPet}
          </Button>
        </header>
        {loading ? (
          <section
            aria-label={messages.loading.label}
            aria-live="polite"
            className="mt-8 grid min-h-56 place-items-center rounded-lg border bg-card px-6 py-12 text-center shadow-[0_2px_8px_rgba(27,48,34,0.04)]"
            role="status"
          >
            <div className="grid justify-items-center gap-3 text-primary">
              <ShellMark className="size-12" />
              <p className="text-sm font-semibold text-muted-foreground">
                {messages.loading.status}
              </p>
            </div>
          </section>
        ) : pets.length ? (
          <section className="mt-6 grid gap-5 md:grid-cols-2">
            {pets.map((pet) => {
              const records = measurements
                .filter((item) => item.petId === pet.id)
                .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt));
              return (
                <article
                  className="tember-pet-card group rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-ambient motion-reduce:transform-none"
                  key={pet.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <PetPortrait photoDataUrl={pet.photoDataUrl} petId={pet.id} />
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {messages.species[pet.species]}
                    </span>
                  </div>
                  <h2 className="mt-5 flex items-center gap-2 font-display text-2xl font-bold text-primary">
                    <span>{pet.name}</span>
                    <SexIdentifier
                      className="font-sans text-xl leading-none"
                      sex={pet.sex}
                      showUnknown={false}
                    />
                  </h2>
                  <div className="mt-5 grid grid-cols-2 gap-4 border-y py-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {messages.dashboard.latest}
                      </p>
                      <p className="mt-1 font-display font-semibold">
                        {records[0]
                          ? formatWeight(records[0].weightGram, "g")
                          : messages.common.notRecorded}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {messages.dashboard.measurementCount}
                      </p>
                      <p className="mt-1 font-display font-semibold">
                        {formatNumber(records.length)}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="mt-5 w-full"
                    onClick={() => onOpen(pet.id)}
                    variant="outline"
                  >
                    {messages.dashboard.openPet}
                  </Button>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="mt-8 rounded-lg border border-dashed bg-card px-6 py-16 text-center">
            <ShellMark className="mx-auto size-14" />
            <h2 className="mt-5 font-display text-2xl font-bold text-primary">
              {messages.dashboard.emptyHeading}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              {messages.dashboard.emptyBody}
            </p>
            <Button className="mt-6" onClick={() => setEditing(true)}>
              <Plus className="mr-2 size-4" />
              {messages.dashboard.addPet}
            </Button>
          </section>
        )}
      </div>
      {editing ? <PetForm onClose={() => setEditing(false)} /> : null}
    </main>
  );
}

function DataView({ onImported }: { onImported: () => void }) {
  const petCount = useLiveQuery(() => db.pets.count()) ?? 0;
  const measurements = useLiveQuery(() => db.measurements.toArray()) ?? [];
  const [backup, setBackup] = useState<unknown>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [status, setStatus] = useState("");
  async function exportJson() {
    const value = await makeBackup();
    downloadFile(
      JSON.stringify(value, null, 2),
      "tember-backup.json",
      "application/json",
    );
  }
  function exportCsv() {
    if (!measurements.length) {
      setStatus(messages.data.noMeasurements);
      return;
    }
    downloadFile(
      measurementsToCsv(measurements),
      "tember-measurements.csv",
      "text/csv;charset=utf-8",
    );
  }
  async function choose(file?: File) {
    if (!file) return;
    try {
      const value: unknown = JSON.parse(await file.text());
      parseBackup(value);
      setBackup(value);
      setStatus("");
    } catch {
      setBackup(undefined);
      setStatus(messages.data.importError);
    }
  }
  return (
    <main className="min-w-0 flex-1 px-5 pb-28 pt-8 sm:px-8 lg:pb-10 lg:pt-10">
      <div className="mx-auto max-w-4xl">
        <header className="tember-hero rounded-2xl p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
            {messages.data.eyebrow}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold text-primary">
            {messages.data.heading}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {messages.data.introduction}
          </p>
        </header>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <section className="tember-pet-card rounded-2xl border p-6">
            <Download className="size-7 text-secondary" />
            <h2 className="mt-5 font-display text-xl font-bold text-primary">
              {messages.data.exportHeading}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {messages.data.exportBody}
            </p>
            <div className="mt-6 grid gap-3">
              <Button onClick={exportJson}>{messages.data.exportJson}</Button>
              <Button onClick={exportCsv} variant="outline">
                {messages.data.exportCsv}
              </Button>
            </div>
          </section>
          <section className="tember-pet-card rounded-2xl border p-6">
            <Upload className="size-7 text-secondary" />
            <h2 className="mt-5 font-display text-xl font-bold text-primary">
              {messages.data.importHeading}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {messages.data.importBody}
            </p>
            <label className="mt-6 flex min-h-11 cursor-pointer items-center justify-center rounded-md border bg-background px-4 text-sm font-semibold text-primary">
              <input
                accept="application/json,.json"
                className="sr-only"
                onChange={(event) => choose(event.target.files?.[0])}
                type="file"
              />
              {messages.data.chooseFile}
            </label>
            {backup ? (
              <div className="mt-4 rounded-md bg-amber-50 p-4 text-sm text-amber-950">
                <p>{messages.data.replaceWarning}</p>
                <Button
                  className="mt-4"
                  onClick={async () => {
                    try {
                      await replaceWithBackup(backup);
                      requestSync();
                      setBackup(undefined);
                      setStatus(messages.data.importSuccess);
                      onImported();
                    } catch {
                      setStatus(messages.data.importError);
                    }
                  }}
                >
                  {messages.data.importConfirm}
                </Button>
              </div>
            ) : null}
          </section>
        </div>
        <section className="mt-8 rounded-lg border border-red-200 bg-red-50/70 p-6">
          <Trash2 className="size-7 text-red-800" />
          <h2 className="mt-5 font-display text-xl font-bold text-red-950">
            {messages.data.deleteHeading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-red-950/75">
            {messages.data.deleteBody}
          </p>
          <Button
            className="mt-6 bg-red-800 hover:bg-red-900"
            disabled={petCount === 0 && measurements.length === 0}
            onClick={() => setConfirmDelete(true)}
          >
            {messages.data.deleteAction}
          </Button>
        </section>
        {status ? (
          <p
            className="mt-5 rounded-md bg-muted p-4 text-sm font-medium"
            role="status"
          >
            {status}
          </p>
        ) : null}
      </div>
      {confirmDelete ? (
        <Confirm
          action={messages.data.deleteAction}
          body={messages.data.deleteBody}
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await clearAllLocalData();
            setBackup(undefined);
            setStatus(messages.data.deleteSuccess);
          }}
          title={messages.data.deleteHeading}
        />
      ) : null}
    </main>
  );
}

function SyncAccountScreen({
  bootstrapNeeded,
  onComplete,
}: {
  bootstrapNeeded: boolean;
  onComplete: () => void;
}) {
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 py-10">
      <form
        className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-ambient sm:p-8"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setError(undefined);
          setSaving(true);
          try {
            const username = String(data.get("username") ?? "");
            const password = String(data.get("password") ?? "");
            if (bootstrapNeeded) await createSharedAccount(username, password);
            else await signInToSync(username, password);
            onComplete();
          } catch (cause) {
            setError(
              cause instanceof Error ? cause.message : messages.sync.syncError,
            );
          } finally {
            setSaving(false);
          }
        }}
      >
        <ShellMark className="size-12 text-primary" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
          {messages.sync.setupEyebrow}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-primary">
          {bootstrapNeeded
            ? messages.sync.setupHeading
            : messages.sync.signInHeading}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {messages.sync.setupBody}
        </p>
        <div className="mt-7 grid gap-5">
          <Field label={messages.sync.username}>
            <input
              autoComplete="username"
              className={inputClass}
              name="username"
              required
            />
          </Field>
          <Field label={messages.sync.password} hint={messages.sync.passwordHelp}>
            <input
              autoComplete={bootstrapNeeded ? "new-password" : "current-password"}
              className={inputClass}
              minLength={12}
              name="password"
              required
              type="password"
            />
          </Field>
        </div>
        {error ? (
          <p className="mt-5 text-sm font-medium text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        <Button className="mt-7 w-full" disabled={saving} type="submit">
          {bootstrapNeeded
            ? messages.sync.createAccount
            : messages.sync.signIn}
        </Button>
      </form>
    </main>
  );
}

export function TemberApp() {
  const [view, setView] = useState<View>("pets");
  const [petId, setPetId] = useState<string>();
  const [storageReady, setStorageReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>();
  useEffect(() => {
    let active = true;
    void ensureDefaultData()
      .catch(() => undefined)
      .then(() => {
        if (active) setStorageReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!storageReady) return;
    let active = true;
    void getSyncStatus()
      .then((status) => {
        if (active) setSyncStatus(status);
      })
      .catch(() => {
        if (active) {
          setSyncStatus({
            configured: false,
            authenticated: false,
            bootstrapNeeded: false,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [storageReady]);
  useEffect(() => {
    if (!storageReady || !syncStatus?.authenticated) return;
    let syncing = false;
    const sync = () => {
      if (syncing) return;
      syncing = true;
      void syncNow().finally(() => {
        syncing = false;
      });
    };
    const pullLatest = () => {
      if (syncing || document.visibilityState !== "visible") return;
      syncing = true;
      void pullLatestSync().finally(() => {
        syncing = false;
      });
    };
    sync();
    window.addEventListener("tember-local-change", sync);
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", pullLatest);
    const refreshInterval = window.setInterval(pullLatest, 30_000);
    return () => {
      window.removeEventListener("tember-local-change", sync);
      window.removeEventListener("online", sync);
      document.removeEventListener("visibilitychange", pullLatest);
      window.clearInterval(refreshInterval);
    };
  }, [storageReady, syncStatus?.authenticated]);
  if (storageReady && syncStatus?.configured && !syncStatus.authenticated) {
    return (
      <SyncAccountScreen
        bootstrapNeeded={syncStatus.bootstrapNeeded}
        onComplete={() =>
          setSyncStatus((status) =>
            status
              ? { ...status, authenticated: true, bootstrapNeeded: false }
              : status,
          )
        }
      />
    );
  }
  return (
    <div className="min-h-dvh min-w-0 max-w-full overflow-x-clip lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-primary px-5 py-7 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <ShellMark className="size-10 text-primary-foreground" />
          <div>
            <p className="font-display text-lg font-bold">
              {messages.common.appName}
            </p>
            <p className="text-xs opacity-70">{messages.common.tagline}</p>
          </div>
        </div>
        <nav className="mt-12 grid gap-2">
          {(["pets", "data"] as View[]).map((item) => (
            <button
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-4 text-left text-sm font-semibold transition",
                view === item && !petId ? "bg-white/12" : "hover:bg-white/8",
              )}
              key={item}
              onClick={() => {
                setPetId(undefined);
                setView(item);
              }}
            >
              {item === "pets" ? (
                <Leaf className="size-5" />
              ) : (
                <Database className="size-5" />
              )}
              {messages.nav[item]}
            </button>
          ))}
        </nav>
        <p className="mt-auto flex items-center gap-2 text-xs opacity-70">
          <ShieldCheck className="size-4" />
          {syncStatus?.authenticated
            ? messages.sync.syncReady
            : messages.nav.localStatus}
        </p>
      </aside>
      {petId ? (
        <PetDetail onBack={() => setPetId(undefined)} petId={petId} />
      ) : view === "pets" ? (
        <PetList onOpen={setPetId} storageReady={storageReady} />
      ) : (
        <DataView
          onImported={() => {
            setView("pets");
            setPetId(undefined);
          }}
        />
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t bg-card/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
        {(["pets", "data"] as View[]).map((item) => (
          <button
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold",
              view === item && !petId
                ? "text-primary"
                : "text-muted-foreground",
            )}
            key={item}
            onClick={() => {
              setPetId(undefined);
              setView(item);
            }}
          >
            {item === "pets" ? (
              <Leaf className="size-5" />
            ) : (
              <Database className="size-5" />
            )}
            {messages.nav[item]}
          </button>
        ))}
      </nav>
    </div>
  );
}
