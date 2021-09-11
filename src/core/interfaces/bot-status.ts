export enum BotStatusEnum {
  NOT_INITIALIZED = `Not initialized`,
  INITIALIZING = `Initializing`,
  INITIALIZED = `Initialized`,
  UPDATING = `Updating`,
  UPDATED = `Updated`,
  WAITING = `Waiting`,
  PROXY_SEARCH = `Looking for a valid proxy`,
}

export interface BotStatus {
  status: BotStatusEnum,
  start: Date
}