-- CreateTable
CREATE TABLE "ImapSyncState" (
    "mailbox" TEXT NOT NULL,
    "uidValidity" BIGINT NOT NULL,
    "lastUid" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImapSyncState_pkey" PRIMARY KEY ("mailbox")
);
