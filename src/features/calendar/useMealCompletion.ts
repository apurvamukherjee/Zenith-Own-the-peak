import { useState } from "react";
import type { TaskDto } from "../../db/types";
import { completeTask } from "../tasks/useTasks";
import { todayKey } from "../../lib/date.utils";

// Shared by every task-completion surface (DayTaskSheet, TimeBlock, the
// TasksPage editor): completing a "mealtime" task for today opens the food
// picker instead of silently marking it done, so planning and logging a meal
// become one tap. Any other task (or a mealtime task for another date) just
// completes normally.
export function useMealCompletion() {
  const [foodPickerTask, setFoodPickerTask] = useState<TaskDto | null>(null);

  function tryComplete(task: TaskDto) {
    if (task.listId === "mealtime" && task.date === todayKey() && task.status !== "done") {
      setFoodPickerTask(task);
      return;
    }
    if (task.id) void completeTask(task.id);
  }

  async function closeFoodPicker() {
    if (foodPickerTask?.id) await completeTask(foodPickerTask.id);
    setFoodPickerTask(null);
  }

  return { foodPickerTask, tryComplete, closeFoodPicker };
}
