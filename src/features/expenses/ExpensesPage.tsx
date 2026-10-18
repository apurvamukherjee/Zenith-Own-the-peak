import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Button, Input, DatePicker, App, Popconfirm, Tag } from "antd";
import { motion } from "framer-motion";
import { Hero } from "../../components/ui/Hero";
import { ListGroup, ListRow } from "../../components/ui/List";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./expenses.css";
import { TbPlus, TbTrash, TbWallet, TbBookmarkPlus, TbSettings2 } from "react-icons/tb";
import dayjs from "dayjs";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { EmptyState } from "../../components/EmptyState";
import { ColdIcon } from "../../components/ColdIcon";
import { Sheet } from "../../components/Sheet";
import { SmartInputNumber } from "../../components/SmartInputNumber";
import { useBackClose } from "../../hooks/useBackClose";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { prettyDate, todayKey } from "../../lib/date.utils";
import {
  useExpenseCategories, useExpenseItems, useExpensesForMonth, useAllExpenses, useCategoryBudgets,
  useRecentExpenseItems, useFavoriteExpenseItems, useFuelSpendThisMonth,
  addExpense, deleteExpense, addExpenseItem, setCategoryBudget, expenseStats,
} from "./useExpenses";
import { expenseIconFor } from "./expenseIcons";
import type { ExpenseCategoryDto, ExpenseItemDto, CategoryBudgetDto } from "../../db/types";

export function ExpensesPage() {
  const categories = useExpenseCategories();
  const monthRows = useExpensesForMonth();
  const allRows = useAllExpenses();
  const budgets = useCategoryBudgets();
  const recentItems = useRecentExpenseItems(6);
  const favoriteItems = useFavoriteExpenseItems();
  const fuelSpend = useFuelSpendThisMonth();
  const { message } = App.useApp();
  const reduced = useReducedMotion();

  const stats = expenseStats(monthRows, budgets);
  const grandTotal = stats.total + fuelSpend;
  const daysLeft = dayjs().daysInMonth() - dayjs().date() + 1;
  const budgetByCategory = new Map(budgets.map((b) => [b.categoryId, b.monthlyBudget]));

  const [entryOpen, setEntryOpen] = useState(false);
  const [budgetsOpen, setBudgetsOpen] = useState(false);

  async function quickLog(item: ExpenseItemDto) {
    await addExpense({ date: todayKey(), categoryId: item.categoryId, itemId: item.id, label: item.name, amount: item.defaultAmount });
    hapticLight();
    message.success(`+₹${item.defaultAmount} ${item.name}`);
  }

  const chips = [...recentItems, ...favoriteItems].filter((it, i, arr) => arr.findIndex((x) => x.id === it.id) === i).slice(0, 8);
  const slices = [
    ...categories.map((c) => ({ id: c.id, name: c.name, color: c.color, v: stats.byCategory[c.id] ?? 0 })),
    ...(fuelSpend > 0 ? [{ id: "__fuel", name: "Bike fuel", color: "#f6b93b", v: fuelSpend }] : []),
  ].filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
  const perDay = stats.totalBudget > 0 ? Math.max(0, Math.floor(stats.remaining / daysLeft)) : null;
  const overall = stats.totalBudget > 0 ? Math.min(100, (stats.total / stats.totalBudget) * 100) : 0;

  return (
    <PageTransition>
      <SectionTitle eyebrow="War chest" title="Spending" right={
        <button type="button" className="z-btn" onClick={() => setBudgetsOpen(true)}><TbSettings2 size={16} /> Budgets</button>
      } />

      <Hero color="var(--success)" color2="var(--gold)" eyebrow={dayjs().format("MMMM")} className="ex-hero"
        right={<span className="z-pill">{daysLeft} day{daysLeft === 1 ? "" : "s"} left</span>}>
        <div className="ex-hero__row">
          <Donut slices={slices} reduced={reduced}>
            <span className="ex-hero__total display">₹{grandTotal.toLocaleString()}</span>
            <span className="ex-hero__label">spent</span>
          </Donut>
          <div className="ex-hero__facts">
            {stats.totalBudget > 0 ? (
              <>
                <div><small>{stats.remaining >= 0 ? "Remaining" : "Over budget"}</small>
                  <b style={{ color: stats.remaining >= 0 ? "var(--success)" : "var(--danger)" }}>₹{Math.abs(stats.remaining).toLocaleString()}</b></div>
                <div><small>Safe to spend / day</small><b>₹{perDay?.toLocaleString()}</b></div>
                <div className="ex-budgetbar"><motion.i initial={reduced ? false : { scaleX: 0 }} animate={{ scaleX: Math.min(100, overall) / 100 }}
                  style={{ width: "100%", transformOrigin: "0 50%", background: overall >= 100 ? "var(--danger)" : overall > 80 ? "var(--warn)" : "var(--success)" }}
                  transition={{ type: "spring", stiffness: 70, damping: 16, delay: 0.3 }} /></div>
                <small className="ex-muted">₹{stats.total.toLocaleString()} of ₹{stats.totalBudget.toLocaleString()} budget{fuelSpend > 0 ? " · fuel not budgeted" : ""}</small>
              </>
            ) : (
              <>
                <div><small>Budget</small><b>Not set</b></div>
                <button type="button" className="ex-link" onClick={() => setBudgetsOpen(true)}>Set monthly budgets →</button>
              </>
            )}
          </div>
        </div>
        {slices.length > 0 && (
          <div className="ex-legend">
            {slices.slice(0, 5).map((x) => <span key={x.id}><i style={{ background: x.color }} />{x.name} ₹{x.v.toLocaleString()}</span>)}
          </div>
        )}
      </Hero>

      {chips.length > 0 && (
        <>
          <div className="z-list-title">Quick add</div>
          <div className="ex-chips">
            {chips.map((it) => {
              const cat = categories.find((c) => c.id === it.categoryId);
              const Icon = cat ? expenseIconFor(cat.icon) : TbWallet;
              return (
                <motion.button key={it.id} type="button" whileTap={{ scale: 0.94 }} className="ex-chip" style={{ "--c": cat?.color ?? "var(--accent)" } as CSSProperties} onClick={() => quickLog(it)}>
                  <Icon size={14} /> {it.name} <b>₹{it.defaultAmount}</b>
                </motion.button>
              );
            })}
          </div>
        </>
      )}

      <button type="button" className="z-btn z-btn--solid z-btn--block ex-log" style={{ "--c": "var(--success)" } as CSSProperties} onClick={() => setEntryOpen(true)}>
        <TbPlus size={18} /> Log an expense
      </button>

      {categories.length > 0 && (
        <ListGroup title="By category" footer={fuelSpend > 0 ? `Includes ₹${fuelSpend.toLocaleString()} bike fuel from the Fuel page.` : undefined}>
          {categories.map((c) => {
            const spent = stats.byCategory[c.id] ?? 0;
            const budget = budgetByCategory.get(c.id) ?? 0;
            const Icon = expenseIconFor(c.icon);
            const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
            return (
              <ListRow key={c.id} icon={<Icon size={16} />} color={c.color} label={c.name}
                hint={budget > 0 ? <span className="ex-rowbar"><i style={{ width: `${pct}%`, background: pct >= 100 ? "var(--danger)" : c.color }} /></span> : "No budget"}
                value={<span><b style={{ color: "var(--ink)" }}>₹{spent.toLocaleString()}</b>{budget > 0 ? ` / ₹${budget.toLocaleString()}` : ""}</span>} />
            );
          })}
        </ListGroup>
      )}

      <ListGroup title="History">
        {allRows.length === 0 ? (
          <EmptyState icon={<ColdIcon glyph="diamond" size={44} />} title="No spending logged"
            hint="Log your first expense above, or tap a quick-add chip once you've saved one." />
        ) : (
          allRows.slice(0, 60).map((r) => {
            const cat = categories.find((c) => c.id === r.categoryId);
            const Icon = cat ? expenseIconFor(cat.icon) : TbWallet;
            return (
              <ListRow key={r.id} icon={<Icon size={15} />} color={cat?.color ?? "var(--ink-soft)"} label={r.label || cat?.name || "Expense"}
                hint={`${prettyDate(r.date)} · ${cat?.name ?? "Uncategorized"}`} value={<b style={{ color: "var(--ink)" }}>₹{r.amount.toLocaleString()}</b>}
                right={
                  <Popconfirm title="Delete this expense?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => r.id && deleteExpense(r.id)}>
                    <button type="button" className="ex-del" aria-label="Delete expense"><TbTrash size={15} /></button>
                  </Popconfirm>
                } />
            );
          })
        )}
      </ListGroup>

      <ExpenseEntryModal open={entryOpen} onClose={() => setEntryOpen(false)} categories={categories} />
      <BudgetSheet open={budgetsOpen} onClose={() => setBudgetsOpen(false)} categories={categories} budgets={budgets} />
    </PageTransition>
  );
}

function Donut({ slices, reduced, children }: { slices: { id: string; color: string; v: number }[]; reduced: boolean; children: ReactNode }) {
  const size = 140, stroke = 16, r = (size - stroke) / 2, c = size / 2;
  const total = slices.reduce((s, x) => s + x.v, 0);
  let acc = 0;
  return (
    <div className="ex-donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={c} cy={c} r={r} fill="none" strokeWidth={stroke} style={{ stroke: "color-mix(in srgb, var(--ink) 8%, transparent)" }} />
        {total > 0 && slices.map((x, i) => {
          const share = x.v / total;
          const start = acc;
          acc += share;
          // A hairline gap between slices; skipped when one slice owns the ring.
          const gap = slices.length > 1 ? Math.min(0.012, share / 3) : 0;
          return (
            <motion.circle key={x.id} cx={c} cy={c} r={r} fill="none" strokeWidth={stroke}
              style={{ stroke: x.color, rotate: start * 360 - 90, originX: "50%", originY: "50%" }}
              initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: Math.max(0, share - gap) }}
              transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.15 + i * 0.08 }} />
          );
        })}
      </svg>
      <div className="ex-donut__center">{children}</div>
    </div>
  );
}

function ExpenseEntryModal({ open, onClose, categories }: {
  open: boolean; onClose: () => void; categories: ExpenseCategoryDto[];
}) {
  const { message } = App.useApp();
  useBackClose(open, onClose);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState<number>();
  const [date, setDate] = useState(dayjs());
  const [saveAsItem, setSaveAsItem] = useState(false);

  const items = useExpenseItems(categoryId);

  useEffect(() => {
    if (open) { setCategoryId(undefined); setLabel(""); setAmount(undefined); setDate(dayjs()); setSaveAsItem(false); }
  }, [open]);

  function pickItem(it: ExpenseItemDto) {
    setLabel(it.name);
    setAmount(it.presets?.[0]?.amount ?? it.defaultAmount);
  }

  async function submit() {
    if (!categoryId) { message.warning("Pick a category"); return; }
    if (!amount || amount <= 0) { message.warning("Enter an amount"); return; }
    const existing = items.find((it) => it.name.toLowerCase() === label.trim().toLowerCase());
    let itemId: number | undefined = existing?.id;
    if (!existing && saveAsItem && label.trim()) {
      itemId = await addExpenseItem({ categoryId, name: label.trim(), defaultAmount: amount, presets: [] });
    }
    await addExpense({ date: date.format("YYYY-MM-DD"), categoryId, itemId, label: label.trim() || undefined, amount });
    hapticSuccess();
    message.success("Expense logged");
    onClose();
  }

  return (
    <Sheet open={open} onCancel={onClose} title="Log an expense" footer={null} destroyOnHidden>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {categories.map((c) => {
          const Icon = expenseIconFor(c.icon);
          const active = categoryId === c.id;
          return (
            <Button key={c.id} size="small" type={active ? "primary" : "default"}
              icon={<Icon />} onClick={() => setCategoryId(c.id)}
              style={active ? { background: c.color, borderColor: c.color } : undefined}>
              {c.name}
            </Button>
          );
        })}
      </div>

      {categoryId && items.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 4 }}>Saved items</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {items.map((it) => (
              <Tag key={it.id} onClick={() => pickItem(it)} style={{ borderRadius: 8, cursor: "pointer", padding: "4px 10px", fontSize: 12 }}>
                {it.name}
              </Tag>
            ))}
          </div>
        </div>
      )}

      <Input placeholder="What was it for? (optional)" value={label} onChange={(e) => setLabel(e.target.value)} style={{ marginBottom: 10 }} />
      <DatePicker inputReadOnly value={date} onChange={(v) => v && setDate(v)} style={{ width: "100%", marginBottom: 10 }} format="DD MMM YYYY" allowClear={false} />
      <SmartInputNumber value={amount} onChange={(v) => setAmount(v == null ? undefined : Number(v))} min={0} placeholder="Amount"
        prefix="₹" style={{ width: "100%", marginBottom: 10 }} />

      {categoryId && label.trim() && !items.some((it) => it.name.toLowerCase() === label.trim().toLowerCase()) && (
        <Button size="small" icon={<TbBookmarkPlus />} type={saveAsItem ? "primary" : "default"}
          onClick={() => setSaveAsItem((v) => !v)} style={{ marginBottom: 12 }}>
          Save as quick-add for next time
        </Button>
      )}

      <Button type="primary" block size="large" onClick={submit} style={{ fontWeight: 700 }}>Log expense</Button>
    </Sheet>
  );
}

function BudgetSheet({ open, onClose, categories, budgets }: {
  open: boolean; onClose: () => void; categories: ExpenseCategoryDto[]; budgets: CategoryBudgetDto[];
}) {
  useBackClose(open, onClose);
  const budgetMap = new Map(budgets.map((b) => [b.categoryId, b.monthlyBudget]));
  return (
    <Sheet open={open} onCancel={onClose} title="Monthly budgets" footer={null} destroyOnHidden>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {categories.map((c) => (
          <BudgetRow key={c.id} category={c} value={budgetMap.get(c.id) ?? 0} />
        ))}
      </div>
    </Sheet>
  );
}

function BudgetRow({ category, value }: { category: ExpenseCategoryDto; value: number }) {
  const [v, setV] = useState(value);
  const Icon = expenseIconFor(category.icon);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Icon style={{ color: category.color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{category.name}</span>
      <SmartInputNumber min={0} step={50} value={v}
        onChange={(nv) => { const n = Number(nv ?? 0); setV(n); setCategoryBudget(category.id, n); }}
        prefix="₹" style={{ width: 130 }} />
    </div>
  );
}
