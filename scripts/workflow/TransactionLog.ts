import {Redis} from "ioredis";
import {injectable, inject} from "inversify";

export interface ITransactionLog {
    setLogId(id: string);

    read(): Promise<Date>;

    commit(timestamp: Date): Promise<void>;
}

@injectable()
export class TransactionLog implements ITransactionLog {

    private logId: string;

    constructor(@inject("RedisClient") private redisClient: Redis) {

    }

    setLogId(id: string) {
        this.logId = id;
    }

    async read(): Promise<Date> {
        let transactionLog = await this.redisClient.get(`prettygoat_workflow:transactions:${this.logId}`);
        return new Date(JSON.parse(transactionLog));
    }

    commit(timestamp: Date): Promise<void> {
        return this.redisClient.set(`prettygoat_workflow:transactions:${this.logId}`, JSON.stringify(timestamp));
    }

}
