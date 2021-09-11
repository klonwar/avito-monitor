import {StateItem} from "#src/core/interfaces/state-item";


const isRegexException = (item: StateItem, exceptRegex: RegExp): boolean => {
  if (!exceptRegex)
    return false;

  return !!exceptRegex?.test(item.info.title);
};

export default isRegexException;