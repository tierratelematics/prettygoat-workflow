import {SideEffect} from "./SideEffect";
import {Redis} from "ioredis";

export interface IWorkflowProcessor {
    process(sideEffect: SideEffect, timestamp: Date): Promise<void>;
}

export class WorkflowProcessor implements IWorkflowProcessor {

    constructor(private workflowId: string, private client: Redis) {

    }

    process(sideEffect: SideEffect, timestamp: Date): Promise<void> {
        throw new Error("Method not implemented.");
    }

}
