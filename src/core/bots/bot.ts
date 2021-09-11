import {StateItem} from "#src/core/interfaces/state-item";
import {BotStatus} from "#src/core/interfaces/bot-status";

export interface Bot {
  sendMessage: (item: StateItem) => Promise<void>
  setBotStatus: (status: BotStatus[]) => void
}