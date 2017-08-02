import {SideEffectAction, SideEffectPolicies} from "./SideEffect";
import {Redis} from "ioredis";
import {NullLogger} from "prettygoat";

export interface IWorkflowProcessor {
    process(action: SideEffectAction, timestamp: Date, policy?: SideEffectPolicies): Promise<void>;
}

export class WorkflowProcessor implements IWorkflowProcessor {

    constructor(private workflowId: string, private client: Redis, private logger = NullLogger) {

    }

    async process(action: SideEffectAction, timestamp: Date, policy = SideEffectPolicies.ABORT): Promise<void> {
        if (!action) return;

        let transactionLog = await this.client.get(`prettygoat_workflow:transactions:${this.workflowId}`);
        let lastTransaction = new Date(JSON.parse(transactionLog));

        if (lastTransaction >= timestamp) return;

        try {
            await action();
            await this.client.set(`prettygoat_workflow:transactions:${this.workflowId}`, JSON.stringify(timestamp));
        } catch (error) {
            this.logger.error(`Side effect for workflow ${this.workflowId} has failed at timestamp ${timestamp}`);
            this.logger.error(error);

            if (policy === SideEffectPolicies.ABORT) {
                throw error;
            }
        }
    }

}
