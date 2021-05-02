interface Status {
  active: boolean
}

export const timeoutPromise = (
  promiseCreator: (status: Status) => Promise<any>,
  timeout = 10000
): Promise<any> => {
  const promiseStatus: Status = {active: true};
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      promiseStatus.active = false;
      resolve({res: false, comment: `timeout`});
    }, timeout);
    const promise = promiseCreator(promiseStatus);
    promise.then(
      (res) => {
        clearTimeout(timeoutId);
        resolve({res, comment: ((res) ? res.status : res)});
      }
    ).catch((e) => {
      clearTimeout(timeoutId);
      resolve({res: false, comment: e.message});
    });
  });
};

export const checkStatus = (status: Status): void => {
  if (!status.active) {
    throw new Error(`Promise timeout`);
  }
};
