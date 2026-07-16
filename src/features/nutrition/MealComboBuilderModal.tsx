import { useState } from "react";
import { Modal, Input, Button, Segmented, App, List, Empty, Popconfirm } from "antd";
import { TbPlus, TbTrash } from "react-icons/tb";
import type { FoodDto, MealType } from "../../db/types";
import { FoodPickerModal } from "./FoodPickerModal";
import { computeMacros, portionLabel } from "./useFoods";
import { createCombo } from "./useMealTemplates";
import { useBackClose } from "../../hooks/useBackClose";

interface Props { open: boolean; onClose: () => void; }

// Add-on #2: build a combo template ("Usual breakfast: 3 eggs + 40g oats + 200ml milk").
// One tap on it later logs each food as its own meal row and sums the macros.
export function MealComboBuilderModal({ open, onClose }: Props) {
  const { message } = App.useApp();
  useBackClose(open, onClose);

  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [items, setItems] = useState<{ food: FoodDto; amount: number }[]>([]);
  const [picking, setPicking] = useState(false);

  function reset() { setName(""); setItems([]); }

  const totals = items.reduce((acc, it) => {
    const m = computeMacros(it.food, it.amount);
    return { p: acc.p + m.protein, f: acc.f + m.fat, c: acc.c + m.carbs, k: acc.k + m.kcal };
  }, { p: 0, f: 0, c: 0, k: 0 });

  async function save() {
    if (!name.trim()) { message.warning("Name your combo"); return; }
    if (items.length === 0) { message.warning("Add at least one food"); return; }
    await createCombo(name, mealType, items.map((it) => ({ foodId: it.food.id!, amount: it.amount })));
    message.success(`Combo "${name}" saved`);
    reset();
    onClose();
  }

  return (
    <Modal open={open} onCancel={() => { reset(); onClose(); }} title="Build a meal combo"
      footer={[
        <Button key="c" onClick={() => { reset(); onClose(); }}>Cancel</Button>,
        <Button key="s" type="primary" onClick={save}>Save combo</Button>,
      ]}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
        <Input placeholder="Usual breakfast" value={name} onChange={(e) => setName(e.target.value)} />
        <Segmented block value={mealType} onChange={(v) => setMealType(v as MealType)}
          options={[
            { label: "Breakfast", value: "breakfast" },
            { label: "Lunch", value: "lunch" },
            { label: "Dinner", value: "dinner" },
            { label: "Snack", value: "snack" },
          ]} />

        <div style={{ background: "var(--bg)", borderRadius: 12, padding: 10, border: "1px solid var(--border)" }}>
          {items.length === 0 ? (
            <Empty description="No foods yet" imageStyle={{ height: 40 }} />
          ) : (
            <List size="small" dataSource={items}
              renderItem={(it, i) => (
                <List.Item style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}
                  actions={[
                    <Popconfirm key="d" title="Remove?" onConfirm={() => setItems((arr) => arr.filter((_, idx) => idx !== i))}>
                      <Button type="text" size="small" danger icon={<TbTrash />} />
                    </Popconfirm>,
                  ]}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{it.food.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                      {portionLabel(it.food, it.amount)} · {computeMacros(it.food, it.amount).kcal} kcal
                    </div>
                  </div>
                </List.Item>
              )} />
          )}
          <Button block icon={<TbPlus />} type="dashed" onClick={() => setPicking(true)} style={{ marginTop: 10 }}>
            Add food
          </Button>
        </div>

        {items.length > 0 && (
          <div style={{ fontSize: 12, color: "var(--ink-soft)", textAlign: "center" }}>
            Combo total: <b style={{ color: "var(--ink)" }}>{Math.round(totals.k)} kcal</b> ·
            {" "}{round1(totals.p)}g P · {round1(totals.f)}g F · {round1(totals.c)}g C
          </div>
        )}
      </div>

      <FoodPickerModal open={picking} onClose={() => setPicking(false)}
        title="Pick a food for the combo"
        onPick={(food, amount) => setItems((arr) => [...arr, { food, amount }])} />
    </Modal>
  );
}

function round1(n: number) { return Math.round(n * 10) / 10; }
