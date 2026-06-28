import type { SenderType } from "./sender-type";

export type Reply = {
  id: string;
  body: string;
  bodyHTML: string | null;
  senderType: SenderType;
  sentAt: string;
};
