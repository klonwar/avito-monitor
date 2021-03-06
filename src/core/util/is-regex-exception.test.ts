
import isRegexException from "#src/core/util/is-regex-exception";
import {ItemStatus, StateItem} from "#src/core/interfaces/state-item";

describe(`Regex filters correctly`, () => {
  const mockItem: StateItem = {
    id: 0,
    status: ItemStatus.NEW,
    valuesChanged: [],
    listLink: `mock`,
    info: {
      title: `mock`,
      price: `mock`,
      date: `mock`,
      link: `mock`,
      photoLink: `mock`,
      geoReferences: `mock`
    }
  };
  const exceptRegex = new RegExp(`1050[ ]?ti`, `i`);

  test(`On simple item`, () => {
    expect(isRegexException(mockItem, exceptRegex)).toBeFalsy();
  });

  test(`On target item`, () => {
    mockItem.info.title = `mock 1050 ti mock`;
    expect(isRegexException(mockItem, exceptRegex)).toBeTruthy();

    mockItem.info.title = `mock 1050ti mock`;
    expect(isRegexException(mockItem, exceptRegex)).toBeTruthy();
  });
});