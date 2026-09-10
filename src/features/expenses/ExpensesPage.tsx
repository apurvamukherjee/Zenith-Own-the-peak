import { useEffect, useState } from "react";
import { Card, Button, Input, DatePicker, Row, Col, Statistic, Progress, App, Popconfirm, Tag, Alert } from "antd";
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

  return (
    <PageTransition>
      <SectionTitle eyebrow="WAR CHEST" title="This month" right={
        <Button size="small" icon={<TbSettings2 />} onClick={() => setBudgetsOpen(true)}>Budgets</Button>
      } />

      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={12}><Card size="small"><Statistic title="Spent this month" value={grandTotal} prefix="₹" valueStyle={{ color: "var(--gold)", fontWeight: 800 }} /></Card></Col>
        <Col span={12}><Card size="small"><Statistic title="Budget" value={stats.totalBudget} prefix="₹" valueStyle={{ fontWeight: 800 }} /></Card></Col>
      </Row>
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card size="small">
            {stats.totalBudget > 0 ? (
              <Statistic title={stats.remaining >= 0 ? "Remaining" : "Over budget"} value={Math.abs(stats.remaining)} prefix="₹"
                valueStyle={{ color: stats.remaining >= 0 ? "var(--teal)" : "#ff5c7a", fontWeight: 800 }} />
            ) : (
              <Statistic title="Remaining" value="—" valueStyle={{ color: "var(--ink-soft)", fontWeight: 800 }} />
            )}
          </Card>
        </Col>
        <Col span={12}><Card size="small"><Statistic title="Days left" value={daysLeft} valueStyle={{ fontWeight: 800 }} /></Card></Col>
      </Row>

      {fuelSpend > 0 && (
        <Alert type="info" showIcon style={{ marginBottom: 16, borderRadius: 10 }}
          message={`+ ₹${fuelSpend} on bike fuel this month — tracked separately on Fuel, included above`} />
      )}

      {categories.length > 0 && (
        <Card title="Budgets by category" size="small" style={{ marginBottom: 16 }}>
          {categories.map((c) => {
            const spent = stats.byCategory[c.id] ?? 0;
            const budget = budgetByCategory.get(c.id) ?? 0;
            const Icon = expenseIconFor(c.icon);
            const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
            return (
              <div key={c.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Icon style={{ color: c.color }} />
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    ₹{spent}{budget > 0 ? ` / ₹${budget}` : ""}
                  </span>
                </div>
                {budget > 0 && <Progress percent={pct} size={[-1, 6]} strokeColor={c.color} showInfo={false} />}
              </div>
            );
          })}
        </Card>
      )}

      {chips.length > 0 && (
        <Card title="Quick add" size="small" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {chips.map((it) => (
              <Tag key={it.id} onClick={() => quickLog(it)} style={{ borderRadius: 8, cursor: "pointer", padding: "4px 10px", fontSize: 12 }}>
                {it.name} · ₹{it.defaultAmount}
              </Tag>
            ))}
          </div>
        </Card>
      )}

      <Button type="primary" block size="large" icon={<TbPlus />} onClick={() => setEntryOpen(true)}
        style={{ marginBottom: 16, fontWeight: 700 }}>
        Log an expense
      </Button>

      <Card title="History" size="small">
        {allRows.length === 0 ? (
          <EmptyState icon={<ColdIcon glyph="diamond" size={80} />} title="No spending logged"
            hint="Log your first expense above, or tap a quick-add chip once you've saved one." />
        ) : (
          allRows.slice(0, 60).map((r) => {
            const cat = categories.find((c) => c.id === r.categoryId);
            const Icon = cat ? expenseIconFor(cat.icon) : TbWallet;
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <Icon style={{ color: cat?.color ?? "var(--ink-soft)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label || cat?.name || "Expense"}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{prettyDate(r.date)} · {cat?.name ?? "Uncategorized"}</div>
                </div>
                <div style={{ fontWeight: 700 }}>₹{r.amount}</div>
                <Popconfirm title="Delete this expense?" okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}
                  onConfirm={() => r.id && deleteExpense(r.id)}>
                  <Button type="text" danger size="small" icon={<TbTrash />} aria-label="Delete" />
                </Popconfirm>
              </div>
            );
          })
        )}
      </Card>

      <ExpenseEntryModal open={entryOpen} onClose={() => setEntryOpen(false)} categories={categories} />
      <BudgetSheet open={budgetsOpen} onClose={() => setBudgetsOpen(false)} categories={categories} budgets={budgets} />
    </PageTransition>
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
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 4 }}>Saved items</div>
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
