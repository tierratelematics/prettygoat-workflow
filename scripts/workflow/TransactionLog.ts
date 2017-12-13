export interface ITransactionLog {
    setLogId(id: string);

    read(): Promise<Date>;

    commit(timestamp: Date): Promise<void>;
}
