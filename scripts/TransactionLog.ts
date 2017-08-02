import {Redis} from "ioredis";

export interface ITransactionLog {
    read(): Promise<Date>;

    commit(timestamp: Date): Promise<void>;
}

export class TransactionLog implements ITransactionLog {

    constructor(private logId: string, private redisClient: Redis) {

    }

    async read(): Promise<Date> {
        let transactionLog = await this.redisClient.get(`prettygoat_workflow:transactions:${this.logId}`);
        return new Date(JSON.parse(transactionLog));
    }

    commit(timestamp: Date): Promise<void> {
        return this.redisClient.set(`prettygoat_workflow:transactions:${this.logId}`, JSON.stringify(timestamp));
    }

}
