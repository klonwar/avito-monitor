export enum ItemStatus {
  PRISTINE,
  NEW,
  CHANGED
}

export interface StateItem {
  id: number;
  status: ItemStatus;
  valuesChanged: Array<{
    key: string
    previousValue: string;
  }>;
  listLink: string
  info: {
    title: string;
    price: string;
    date: string;
    link: string;
    photoLink: string;
    geoReferences: string;
  }
}