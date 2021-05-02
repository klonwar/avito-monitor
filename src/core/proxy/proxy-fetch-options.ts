import {RequestInit} from "node-fetch";
import HttpsProxyAgent from "https-proxy-agent/dist/agent";

export const proxyFetchOptions = (proxy: string | HttpsProxyAgent, target: string): RequestInit => {
  const headers = {
  };
  if (proxy) {
    return (typeof proxy === `string`)
      ? {
        headers,
        agent: new HttpsProxyAgent(`http://${proxy}`)
      }
      : {
        headers,
        agent: proxy
      };
  }

  return {
    headers
  };
};
