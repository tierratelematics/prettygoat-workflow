export interface ITransactionLog {
    setLogId(id: string);

    read(): Promise<TransactionData>;

    commit(timestamp: Date, eventId?: string): Promise<void>;
}

export type TransactionData = {
    lastTransaction: Date;
    eventId: string;
}
