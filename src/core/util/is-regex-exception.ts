import {StateItem} from "#src/model/task";

const isRegexException = (item: StateItem, exceptRegex: RegExp): boolean => {
  if (!exceptRegex)
    return false;

  return !!exceptRegex?.test(item.info.title);
};

export default isRegexException;