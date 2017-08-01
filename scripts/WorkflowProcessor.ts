import {SideEffect, SideEffectPolicies} from "./SideEffect";
import {Redis} from "ioredis";
import {NullLogger} from "prettygoat";

export interface IWorkflowProcessor {
    process(sideEffect: SideEffect, timestamp: Date): Promise<void>;
}

export class WorkflowProcessor implements IWorkflowProcessor {

    constructor(private workflowId: string, private client: Redis, private logger = NullLogger) {

    }

    async process(sideEffect: SideEffect, timestamp: Date): Promise<void> {
        if (!sideEffect || (sideEffect && !sideEffect.action)) return;

        let transactionLog = await this.client.get(`prettygoat_workflow:transactions:${this.workflowId}`);
        let lastTransaction = new Date(JSON.parse(transactionLog));

        if (lastTransaction >= timestamp) return;

        try {
            await sideEffect.action(sideEffect.args);
        } catch (error) {
            this.logger.error(`Side effect for workflow ${this.workflowId} has failed at timestamp ${timestamp}`);
            this.logger.error(error);

            if (sideEffect.policy === SideEffectPolicies.STOP) {
                return Promise.reject(error);
            }
        }
        await this.client.set(`prettygoat_workflow:transactions:${this.workflowId}`, JSON.stringify(timestamp));
    }

}
