import Task, {ItemStatus} from "./task";
import {mockLink} from "#mocks/variables";
import readFile from "#src/util/read-file";
import chalk from "chalk";
jest.mock(`node-fetch`, () => require(`fetch-mock-jest`).sandbox());
import fetchTemp from "node-fetch";
import {FetchMockStatic} from "fetch-mock";
const fetch = (fetchTemp as unknown) as (typeof fetchTemp) & FetchMockStatic;

describe(`Task`, () => {

  describe(`Subscribe functions work`, () => {
    afterEach(() => {
      fetch.restore();
    });

    test(`onNew`, async () => {
      const firstResponse = await readFile(`test-settings/__mocks__/task/on-new/first.html`);
      const secondResponse = await readFile(`test-settings/__mocks__/task/on-new/second.html`);

      const onNew = jest.fn();

      const task = new Task({
        link: mockLink,
        subscribe: {
          onNew
        }
      });

      // console.log(firstResponse);

      fetch.getOnce(mockLink, () => firstResponse);

      await task.init();
      expect(onNew).toBeCalledTimes(0);

      fetch.getOnce(mockLink, () => secondResponse, {overwriteRoutes: false});
      await task.update();
      expect(onNew).toBeCalledTimes(1);

      expect(onNew.mock.calls[0][0][`id`]).toBe(2027173339999);
      expect(onNew.mock.calls[0][0][`status`]).toBe(ItemStatus.NEW);
    });

    test(`onUpdate`, async () => {
      const firstResponse = await readFile(`test-settings/__mocks__/task/on-update/first.html`);
      const secondResponse = await readFile(`test-settings/__mocks__/task/on-update/second.html`);

      const onChanged = jest.fn();

      const task = new Task({
        link: mockLink,
        subscribe: {
          onChanged
        }
      });

      // console.log(firstResponse);

      fetch.getOnce(mockLink, () => firstResponse);

      await task.init();
      expect(onChanged).toBeCalledTimes(0);

      fetch.getOnce(mockLink, () => secondResponse, {overwriteRoutes: false});
      await task.update();
      expect(onChanged).toBeCalledTimes(1);

      expect(onChanged.mock.calls[0][0][`id`]).toBe(2020852365);
      expect(onChanged.mock.calls[0][0][`status`]).toBe(ItemStatus.CHANGED);

    });

  });

});