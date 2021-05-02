class IpBanError extends Error {
  constructor() {
    super(`Your ip is banned`);
  }
}

export default IpBanError;