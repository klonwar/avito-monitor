import webhookDataConstructor from "#src/core/bots/discord/util/webhook-data-constructor";
import {mockLink} from "#mocks/variables";
import {ItemStatus} from "#src/core/interfaces/state-item";
import {WEBHOOK_CONFIG} from "#src/config";

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
      color: WEBHOOK_CONFIG.newItemColor,
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
      color: WEBHOOK_CONFIG.changedColor,
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