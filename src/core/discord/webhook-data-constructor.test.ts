import webhookDataConstructor from "#src/core/discord/webhook-data-constructor";
import {ItemStatus} from "#src/model/task";
import {mockLink} from "#mocks/variables";
import {WEBHOOK_CHANGED_COLOR, WEBHOOK_NEW_COLOR} from "#src/config";

describe(`Webhook messages display correctly`, () => {
  const mockInfo = {
    title: `mockTitle`,
    link: mockLink,
    photoLink: mockLink,
    price: `mockPrice`,
    date: `mockDate`,
    geoReferences: `mockGeo`
  };


  test(`Simple new message`, () => {
    const webhookData = webhookDataConstructor({
      id: 1000,
      status: ItemStatus.NEW,
      listLink: `mockListLink`,
      valuesChanged: [],
      info: mockInfo
    });

    expect(webhookData.embeds[0]).toMatchObject({
      title: `${mockInfo.title} - ${mockInfo.price}`,
      url: mockLink,
      color: WEBHOOK_NEW_COLOR,
      thumbnail: {
        url: mockLink
      }
    });

    expect(webhookData.embeds[0].fields.find(
      (item) => item.name === `Price`
    )?.value).toMatch(
      new RegExp(`[\\s]${mockInfo.price}[\\s]`)
    );

    expect(webhookData.embeds[0].fields.find(
      (item) => item.name === `Geo`
    )?.value).toMatch(
      new RegExp(`[\\s]${mockInfo.geoReferences}[\\s]`)
    );

  });

  test(`Simple changed message`, () => {
    const webhookData = webhookDataConstructor({
      id: 1000,
      status: ItemStatus.CHANGED,
      listLink: `mockListLink`,
      valuesChanged: [
        {
          key: `price`,
          previousValue: mockInfo.price + `_prev`
        }
      ],
      info: mockInfo
    });

    expect(webhookData.embeds[0]).toMatchObject({
      title: `${mockInfo.title} - ${mockInfo.price}`,
      url: mockLink,
      color: WEBHOOK_CHANGED_COLOR,
      thumbnail: {
        url: mockLink
      }
    });

    expect(webhookData.embeds[0].fields.find(
      (item) => item.name === `Price`
    )?.value).toMatch(
      new RegExp(`[\\s]\\*\\*${mockInfo.price}\\*\\* \\(~~${mockInfo.price + `_prev`}~~\\)[\\s]`)
    );

    expect(webhookData.embeds[0].fields.find(
      (item) => item.name === `Geo`
    )?.value).toMatch(
      new RegExp(`[\\s]${mockInfo.geoReferences}[\\s]`)
    );

  });

});