import {SideEffectAction, SideEffectPolicies} from "./SideEffect";
import {NullLogger, ILogger} from "prettygoat";
import {ITransactionLog} from "./TransactionLog";

export interface IWorkflowProcessor {
    process(action: SideEffectAction, timestamp: Date, eventId?: string, policy?: SideEffectPolicies): Promise<void>;
}

export class WorkflowProcessor implements IWorkflowProcessor {

    constructor(private workflowId: string, private transactionLog: ITransactionLog, private logger: ILogger = NullLogger) {

    }

    async process(action: SideEffectAction, timestamp: Date, eventId: string = null, policy = SideEffectPolicies.ABORT): Promise<void> {
        let data = await this.transactionLog.read(),
            lastTransaction = data ? data.lastTransaction : null,
            lastEventId = data ? data.eventId : null;
        this.logger.debug(`Last transaction: ${lastTransaction}, event id: ${lastEventId}`);
        if (!action) {
            this.logger.debug("Provide an action to process");
            return;
        }
        if (lastTransaction > timestamp || (+lastTransaction === +timestamp && eventId === lastEventId)) {
            this.logger.debug("Skipping action since it has been already processed");
            return;
        }

        try {
            await action();
            await this.transactionLog.commit(timestamp, eventId);
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
