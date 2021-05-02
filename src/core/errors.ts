export class IpBanError extends Error {
  constructor() {
    super(`Your ip is banned`);
  }
}

export class TimeoutError extends Error {
  constructor() {
    super(`Timeout`);
  }
}