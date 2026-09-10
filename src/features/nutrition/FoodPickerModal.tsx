import { useEffect, useMemo, useState } from "react";
import { Modal, Input, Button, Tag, Segmented, App, Popconfirm } from "antd";
import { SmartInputNumber } from "../../components/SmartInputNumber";
import { TbStar, TbStarFilled, TbSearch, TbPlus, TbHeart, TbTrash, TbBookmarkPlus } from "react-icons/tb";
import type { FoodDto, MealType } from "../../db/types";
import { db } from "../../db/db";
import {
  useFoods, useFavoriteFoods, useRecentFoods,
  toggleFoodFavorite, addCustomFood, deleteFood,
  computeMacros, portionLabel, defaultPresets, savePreset, logFood,
} from "./useFoods";
import { useBackClose } from "../../hooks/useBackClose";
import { hapticLight } from "../../lib/haptics";
import { recordUsage } from "../../hooks/useUsageHistory";
import { Sheet } from "../../components/Sheet";
import { nowHHMM } from "./useNutrition";
import { todayKey } from "../../lib/date.utils";
import type { FoodPresetDto } from "../../db/types";

interface Props {
  open: boolean;
  onClose: () => void;
  // Optional: when picker is used to build a combo, caller handles the pick instead of logging.
  onPick?: (food: FoodDto, amount: number) => void;
  defaultMealType?: MealType;
  title?: string;
  date?: string; // defaults to today; used when logging against a specific planned-meal date
}

export function FoodPickerModal({ open, onClose, onPick, defaultMealType = "breakfast", title = "Add food", date }: Props) {
  const { message } = App.useApp();
  useBackClose(open, onClose);

  const foods = useFoods();
  const favorites = useFavoriteFoods();
  const recent = useRecentFoods(5);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodDto | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [tab, setTab] = useState<"food" | "custom">("food");
  const [showAddCustom, setShowAddCustom] = useState(false);

  useEffect(() => {
    if (!open) { setQuery(""); setSelected(null); setTab("food"); }
  }, [open]);

  useEffect(() => { setMealType(defaultMealType); }, [defaultMealType, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter((f) => f.name.toLowerCase().includes(q));
  }, [foods, query]);

  const preview = selected ? computeMacros(selected, amount) : null;

  async function commit() {
    if (!selected) return;
    if (onPick) {
      onPick(selected, amount);
      onClose();
      return;
    }
    await logFood(selected, amount, mealType, date ?? todayKey(), nowHHMM());
    // Record the last-used grams for this food id so next tap suggests it.
    if (selected.id != null) void recordUsage(`grams:${selected.id}`, amount);
    hapticLight();
    message.success(`Logged ${selected.name}`);
    onClose();
  }

  // Predictive default: when a food is picked, use its remembered portion
  // if one exists; otherwise its first preset; otherwise the unit default.
  function initialAmountFor(f: FoodDto, remembered?: number): number {
    if (remembered && remembered > 0) return remembered;
    return f.presets?.[0]?.amount ?? (f.unit === "g" || f.unit === "ml" ? 100 : 1);
  }
  // Async resolver reads the last-used amount for a food from usageHistory.
  // Falls back to preset defaults if nothing is remembered yet.
  async function pickFood(f: FoodDto) {
    let remembered: number | undefined;
    if (f.id != null) {
      try {
        const row = await db.usageHistory.get(`grams:${f.id}`);
        remembered = row?.value;
      } catch { /* ignore */ }
    }
    setSelected(f);
    setAmount(initialAmountFor(f, remembered));
  }

  return (
    <Sheet open={open} onCancel={onClose} title={title}
      footer={null} destroyOnHidden width={520}
      styles={{ body: { paddingTop: 8 } }}>
      <Segmented block value={tab} onChange={(v) => setTab(v as typeof tab)}
        options={[{ label: "From food", value: "food" }, { label: "Custom", value: "custom" }]}
        style={{ marginBottom: 12 }} />

      {tab === "food" && (
        <>
          {!selected && (
            <>
              <Input
                allowClear placeholder="Search paneer, roti, whey…"
                value={query} onChange={(e) => setQuery(e.target.value)}
                prefix={<TbSearch style={{ color: "var(--ink-soft)" }} />}
                style={{ marginBottom: 10 }}
              />

              {recent.length > 0 && !query && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 4 }}>Recent</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {recent.map((f) => (
                      <Tag key={f.id} onClick={() => { pickFood(f); }}
                        style={{ borderRadius: 8, cursor: "pointer", padding: "4px 10px", fontSize: 12 }}>
                        {f.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {favorites.length > 0 && !query && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 4 }}>
                    <TbHeart style={{ verticalAlign: "-2px" }} /> Favorites
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {favorites.map((f) => (
                      <Tag key={f.id} color="volcano" onClick={() => { pickFood(f); }}
                        style={{ borderRadius: 8, cursor: "pointer", padding: "4px 10px", fontSize: 12 }}>
                        {f.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ maxHeight: 340, overflowY: "auto", marginBottom: 8 }}>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 20, color: "var(--ink-soft)", fontSize: 13 }}>
                    No matches. Try Custom, or add it below.
                    <div style={{ marginTop: 10 }}>
                      <Button icon={<TbPlus />} onClick={() => setShowAddCustom(true)}>Add "{query || "new food"}" to catalog</Button>
                    </div>
                  </div>
                ) : (
                  filtered.map((f) => (
                    <FoodRow key={f.id} food={f}
                      onSelect={() => { pickFood(f); }} />
                  ))
                )}
              </div>

              <Button block icon={<TbPlus />} onClick={() => setShowAddCustom(true)} type="dashed">
                Add a food to your catalog
              </Button>

              <AddCustomFoodModal open={showAddCustom} onClose={() => setShowAddCustom(false)}
                initialName={query} onCreated={(f) => { setSelected(f); setAmount(f.unit === "g" || f.unit === "ml" ? 100 : 1); setShowAddCustom(false); }} />
            </>
          )}

          {selected && (
            <FoodDetail
              food={selected}
              amount={amount}
              setAmount={setAmount}
              mealType={mealType}
              setMealType={setMealType}
              hideMealType={!!onPick}
              preview={preview}
              onBack={() => setSelected(null)}
              onCommit={commit}
            />
          )}
        </>
      )}

      {tab === "custom" && (
        <CustomHandEntry onClose={onClose} defaultMealType={mealType} />
      )}
    </Sheet>
  );
}

function FoodRow({ food, onSelect }: { food: FoodDto; onSelect: () => void }) {
  // Long-press to favorite. Also tap-star for accessibility.
  const [longPressTimer, setTimer] = useState<number | null>(null);
  function startPress() {
    const id = window.setTimeout(async () => {
      await toggleFoodFavorite(food.id!);
      hapticLight();
    }, 500);
    setTimer(id);
  }
  function endPress() { if (longPressTimer) window.clearTimeout(longPressTimer); setTimer(null); }

  return (
    <div
      onClick={onSelect}
      onTouchStart={startPress} onTouchEnd={endPress} onTouchCancel={endPress}
      onMouseDown={startPress} onMouseUp={endPress} onMouseLeave={endPress}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 8px",
        borderBottom: "1px solid var(--border)", cursor: "pointer",
      }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)" }}>{food.name}</div>
        <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
          {food.unit === "g" || food.unit === "ml"
            ? `per 100${food.unit}: ${food.protein}p · ${food.fat}f · ${food.carbs}c · ${food.kcal}kcal`
            : `per ${food.unit}: ${food.protein}p · ${food.fat}f · ${food.carbs}c · ${food.kcal}kcal`}
        </div>
      </div>
      <Button type="text" size="small"
        icon={food.favorite ? <TbStarFilled style={{ color: "var(--gold)" }} /> : <TbStar style={{ color: "var(--ink-soft)" }} />}
        onClick={(e) => { e.stopPropagation(); toggleFoodFavorite(food.id!); }}
        aria-label="Favorite" />
      {food.isCustom === 1 && (
        <Popconfirm title="Delete this custom food?" okText="Delete" okButtonProps={{ danger: true }}
          onConfirm={(e) => { e?.stopPropagation(); deleteFood(food.id!); }}
          onCancel={(e) => e?.stopPropagation()}>
          <Button type="text" size="small" danger icon={<TbTrash />} onClick={(e) => e.stopPropagation()} aria-label="Delete custom" />
        </Popconfirm>
      )}
    </div>
  );
}

function FoodDetail({ food, amount, setAmount, mealType, setMealType, hideMealType, preview, onBack, onCommit }: {
  food: FoodDto; amount: number; setAmount: (n: number) => void;
  mealType: MealType; setMealType: (m: MealType) => void;
  hideMealType: boolean;
  preview: { protein: number; fat: number; carbs: number; kcal: number } | null;
  onBack: () => void; onCommit: () => void;
}) {
  const presets = defaultPresets(food);
  const { message } = App.useApp();

  async function savePresetHere() {
    const label = prompt(`Save "${portionLabel(food, amount)}" as a quick preset. Label:`, portionLabel(food, amount));
    if (!label?.trim()) return;
    const preset: FoodPresetDto = { label: label.trim(), amount };
    await savePreset(food.id!, preset);
    message.success("Preset saved");
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Button size="small" onClick={onBack}>← Back</Button>
        <div style={{ fontWeight: 700, fontSize: 14, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{food.name}</div>
        <Button type="text" size="small"
          icon={food.favorite ? <TbStarFilled style={{ color: "var(--gold)" }} /> : <TbStar />}
          onClick={() => toggleFoodFavorite(food.id!)} aria-label="Favorite" />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>Portion</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {presets.map((p, i) => (
          <Button key={i} size="small" type={amount === p.amount ? "primary" : "default"} onClick={() => setAmount(p.amount)}>
            {p.label}
          </Button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <SmartInputNumber value={amount} min={0.1} step={food.unit === "g" || food.unit === "ml" ? 10 : 0.5}
          onChange={(v) => setAmount(Number(v ?? 0))} style={{ flex: 1 }}
          suffix={food.unit === "g" || food.unit === "ml" ? food.unit : food.unit + (amount === 1 ? "" : "s")} />
        <Button icon={<TbBookmarkPlus />} onClick={savePresetHere} title="Save as preset" />
      </div>

      {preview && (
        <div style={{ background: "var(--bg)", borderRadius: 12, padding: "10px 12px", marginBottom: 12,
          border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700, marginBottom: 4 }}>You'll add</div>
          <div className="display" style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>
            {preview.kcal} <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>kcal</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink)" }}>
            {preview.protein}g protein · {preview.fat}g fat · {preview.carbs}g carbs
          </div>
        </div>
      )}

      {!hideMealType && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>Meal</div>
          <Segmented block value={mealType} onChange={(v) => setMealType(v as MealType)}
            options={[
              { label: "Breakfast", value: "breakfast" },
              { label: "Lunch", value: "lunch" },
              { label: "Dinner", value: "dinner" },
              { label: "Snack", value: "snack" },
            ]} style={{ marginBottom: 12 }} />
        </>
      )}

      <Button type="primary" block size="large" onClick={onCommit}>
        {hideMealType ? "Add to combo" : "Log meal"}
      </Button>
    </div>
  );
}

function AddCustomFoodModal({ open, onClose, initialName, onCreated }: {
  open: boolean; onClose: () => void; initialName?: string;
  onCreated: (food: FoodDto) => void;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [unit, setUnit] = useState<FoodDto["unit"]>("g");
  const [protein, setProtein] = useState<number>(0);
  const [fat, setFat] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [kcal, setKcal] = useState<number>(0);

  useEffect(() => { if (open) setName(initialName ?? ""); }, [open, initialName]);
  useBackClose(open, onClose);

  async function submit() {
    if (!name.trim()) return;
    const id = await addCustomFood({
      name: name.trim(), category: "custom", unit,
      protein, fat, carbs, kcal, presets: [],
    });
    const created = { id, name: name.trim(), category: "custom" as const, unit, protein, fat, carbs, kcal,
      presets: [], favorite: 0, isCustom: 1, createdAt: Date.now() };
    onCreated(created);
  }

  return (
    <Modal open={open} onCancel={onClose} title="Add custom food" onOk={submit} okText="Add">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        <Input placeholder="Ma's aloo paratha" value={name} onChange={(e) => setName(e.target.value)} />
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>Values are per…</div>
        <Segmented block value={unit} onChange={(v) => setUnit(v as FoodDto["unit"])}
          options={[
            { label: "100g", value: "g" },
            { label: "100ml", value: "ml" },
            { label: "1 piece", value: "piece" },
            { label: "1 tbsp", value: "tbsp" },
          ]} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <LabeledNum label="Protein (g)" value={protein} onChange={setProtein} />
          <LabeledNum label="Fat (g)" value={fat} onChange={setFat} />
          <LabeledNum label="Carbs (g)" value={carbs} onChange={setCarbs} />
          <LabeledNum label="Calories" value={kcal} onChange={setKcal} />
        </div>
      </div>
    </Modal>
  );
}

function LabeledNum({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 2 }}>{label}</div>
      <SmartInputNumber value={value} min={0} step={0.1}
        onChange={(v) => onChange(Number(v ?? 0))} style={{ width: "100%" }} />
    </div>
  );
}

function CustomHandEntry({ onClose, defaultMealType }: { onClose: () => void; defaultMealType: MealType }) {
  const { message } = App.useApp();
  const [name, setName] = useState("");
  const [type, setType] = useState<MealType>(defaultMealType);
  const [protein, setProtein] = useState<number>();
  const [calories, setCalories] = useState<number>();
  const [fat, setFat] = useState<number>();
  const [carbs, setCarbs] = useState<number>();

  useEffect(() => { setType(defaultMealType); }, [defaultMealType]);

  async function submit() {
    if (!name.trim()) { message.warning("Name the meal"); return; }
    await db.meals.add({
      date: todayKey(), time: nowHHMM(),
      name: name.trim(), mealType: type,
      protein: protein ?? 0, calories: calories ?? 0,
      fatG: fat, carbsG: carbs,
    });
    setName(""); setProtein(undefined); setCalories(undefined); setFat(undefined); setCarbs(undefined);
    message.success("Meal logged");
    onClose();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Input placeholder="What did you eat?" value={name} onChange={(e) => setName(e.target.value)} />
      <Segmented block value={type} onChange={(v) => setType(v as MealType)}
        options={[
          { label: "Breakfast", value: "breakfast" },
          { label: "Lunch", value: "lunch" },
          { label: "Dinner", value: "dinner" },
          { label: "Snack", value: "snack" },
        ]} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <LabeledNum label="Protein (g)" value={protein ?? 0} onChange={(n) => setProtein(n)} />
        <LabeledNum label="Calories" value={calories ?? 0} onChange={(n) => setCalories(n)} />
        <LabeledNum label="Fat (g) — optional" value={fat ?? 0} onChange={(n) => setFat(n)} />
        <LabeledNum label="Carbs (g) — optional" value={carbs ?? 0} onChange={(n) => setCarbs(n)} />
      </div>
      <Button type="primary" block onClick={submit}>Log meal</Button>
    </div>
  );
}
