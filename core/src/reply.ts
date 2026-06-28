import type { SenderType } from "./sender-type";

export type Reply = {
  id: string;
  body: string;
  senderType: SenderType;
  sentAt: string;
};
