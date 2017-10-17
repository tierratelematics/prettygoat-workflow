import {SideEffectAction, SideEffectPolicies} from "./SideEffect";
import {NullLogger, ILogger} from "prettygoat";
import {ITransactionLog} from "./TransactionLog";

export interface IWorkflowProcessor {
    process(action: SideEffectAction, timestamp: Date, policy?: SideEffectPolicies): Promise<void>;
}

export class WorkflowProcessor implements IWorkflowProcessor {

    constructor(private workflowId: string, private transactionLog: ITransactionLog, private logger: ILogger = NullLogger) {

    }

    async process(action: SideEffectAction, timestamp: Date, policy = SideEffectPolicies.ABORT): Promise<void> {
        let lastTransaction = await this.transactionLog.read();
        this.logger.debug(`Last transaction: ${lastTransaction}, current event: ${timestamp}`);
        if (lastTransaction >= timestamp || !action) {
            this.logger.debug("Skipping action since it has been already processed");
            return;
        }

        try {
            await action();
            await this.transactionLog.commit(timestamp);
            this.logger.debug(`Updated transaction log to ${timestamp}`);
        } catch (error) {
            this.logger.error(`Side effect for workflow ${this.workflowId} has failed at timestamp ${timestamp}`);
            this.logger.error(error);

            if (policy === SideEffectPolicies.ABORT) {
                throw error;
            }
        }
    }

}
