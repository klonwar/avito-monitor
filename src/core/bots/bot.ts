import { StateItem } from "#src/core/interfaces/state-item";
import Task from "#src/core/task/task";

export interface Bot {
  sendMessage: (item: StateItem) => Promise<void>
  setTask: (task: Task) => void
}