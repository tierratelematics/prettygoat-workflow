import {SideEffectAction, SideEffectPolicies} from "./SideEffect";
import {NullLogger} from "prettygoat";
import {ITransactionLog} from "./TransactionLog";

export interface IWorkflowProcessor {
    process(action: SideEffectAction, timestamp: Date, policy?: SideEffectPolicies): Promise<void>;
}

export class WorkflowProcessor implements IWorkflowProcessor {

    constructor(private workflowId: string, private transactionLog: ITransactionLog, private logger = NullLogger) {

    }

    async process(action: SideEffectAction, timestamp: Date, policy = SideEffectPolicies.ABORT): Promise<void> {
        let lastTransaction = await this.transactionLog.read();
        if (lastTransaction >= timestamp || !action) return;

        try {
            await action();
            await this.transactionLog.commit(timestamp);
        } catch (error) {
            this.logger.error(`Side effect for workflow ${this.workflowId} has failed at timestamp ${timestamp}`);
            this.logger.error(error);

            if (policy === SideEffectPolicies.ABORT) {
                throw error;
            }
        }
    }

}
