import { Fragment, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { TbCheck, TbCalendarPlus, TbChevronRight, TbMapPin } from "react-icons/tb";
import { Skeleton } from "../../components/Skeleton";
import { FoodPickerModal } from "../nutrition/FoodPickerModal";
import { useMealCompletion } from "../calendar/useMealCompletion";
import { updateTask } from "../tasks/useTasks";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import type { AgendaItem } from "./useHomeData";

const MAX = 6;

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function TodayAgenda({ items }: { items: AgendaItem[] | undefined }) {
  const meal = useMealCompletion();
  if (items === undefined) return <Skeleton height={120} radius={22} />;

  const now = nowHHMM();
  const open = items.filter((i) => i.status !== "done").length;
  // Keep the window anchored around "now": past-done items scroll off first.
  const firstRelevant = Math.max(0, items.findIndex((i) => i.allDay || i.status !== "done" || (i.time ?? "") >= now));
  const shown = items.slice(firstRelevant, firstRelevant + MAX);
  const nowIdx = shown.findIndex((i) => !i.allDay && (i.time ?? "99:99") > now);

  function toggle(item: AgendaItem) {
    if (item.status === "done") {
      void updateTask(item.id!, { status: "todo", completedAt: undefined });
      void hapticLight();
      return;
    }
    meal.tryComplete(item);
    void hapticSuccess();
  }

  return (
    <section className="hb-agenda" aria-label="Today's agenda">
      <div className="hb-agenda__head">
        <span className="gothic-eyebrow">Today</span>
        <span className="hb-agenda__count">{items.length === 0 ? "" : open === 0 ? "All clear" : `${open} left`}</span>
        <Link to="/calendar" className="hb-agenda__open" aria-label="Open calendar"><TbChevronRight size={16} /></Link>
      </div>

      {items.length === 0 ? (
        <Link to="/calendar" className="hb-agenda__empty">
          <TbCalendarPlus size={22} />
          <div>
            <div style={{ fontWeight: 700 }}>Nothing scheduled</div>
            <div className="hb-muted">Block out training, meals and study — tap to plan</div>
          </div>
        </Link>
      ) : (
        <ol className="hb-timeline">
          <AnimatePresence initial={false}>
            {shown.map((item, i) => {
              const done = item.status === "done";
              const overdue = !done && !item.allDay && !!item.time && item.time < now;
              return (
                <Fragment key={item.id}>
                  {i === nowIdx && <NowMarker time={now} />}
                  <motion.li layout
                    className={`hb-event${done ? " is-done" : ""}${overdue ? " is-overdue" : ""}`}
                    style={{ "--c": item.list?.color ?? "var(--accent)" } as CSSProperties}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}>
                    <span className="hb-event__time">{item.allDay ? "All day" : item.time ?? "—"}</span>
                    <span className="hb-event__rail" aria-hidden><i /></span>
                    <Link to="/calendar" className="hb-event__body">
                      <span className="hb-event__title">{item.title}</span>
                      <span className="hb-event__meta">
                        {item.list?.name}
                        {item.endTime && !item.allDay ? ` · until ${item.endTime}` : ""}
                        {item.location && <> · <TbMapPin size={11} /> {item.location}</>}
                      </span>
                    </Link>
                    <motion.button whileTap={{ scale: 0.8 }} className="hb-event__check"
                      aria-label={done ? `Mark ${item.title} not done` : `Complete ${item.title}`} aria-pressed={done}
                      onClick={() => toggle(item)}>
                      <AnimatePresence>
                        {done && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                            <TbCheck size={14} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </motion.li>
                </Fragment>
              );
            })}
            {nowIdx === -1 && shown.length > 0 && <NowMarker key="now-end" time={now} />}
          </AnimatePresence>
        </ol>
      )}
      {items.length > firstRelevant + MAX && (
        <Link to="/calendar" className="hb-agenda__more">+{items.length - firstRelevant - MAX} more today</Link>
      )}

      <FoodPickerModal open={!!meal.foodPickerTask} onClose={meal.closeFoodPicker}
        defaultMealType="lunch" title={meal.foodPickerTask?.title ?? "Log meal"} />
    </section>
  );
}

function NowMarker({ time }: { time: string }) {
  return (
    <li className="hb-now" aria-label={`Now, ${time}`}>
      <span className="hb-now__time">{time}</span>
      <span className="hb-now__line"><i /></span>
    </li>
  );
}
