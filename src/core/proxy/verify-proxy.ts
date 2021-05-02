import fetch from "node-fetch";
import {proxyFetchOptions} from "#src/core/proxy/proxy-fetch-options";
import {timeoutPromise} from "#src/core/util/timeout-promise";

export const verifyProxy = async (proxy: string, target: string, timeout = 5000): Promise<{
  valid: boolean,
  comment: string
}> => {
  const promiseCreator = () => fetch(target, proxyFetchOptions(proxy, target));
  try {
    const res = await timeoutPromise(promiseCreator, timeout);
    return {
      valid: res.res.ok,
      comment: res.comment
    };
  } catch (e) {
    return {
      valid: false,
      comment: e.message
    };
  }
};