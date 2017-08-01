import {IWorkflowProcessor, WorkflowProcessor} from "./WorkflowProcessor";
import {inject, injectable} from "inversify";

export interface IWorkflowProcessorFactory {
    processorFor(id: string): IWorkflowProcessor;
}

@injectable()
export class WorkflowProcessorFactory implements IWorkflowProcessorFactory {

    constructor(@inject("RedisClient") private redisClient) {

    }

    processorFor(id: string): IWorkflowProcessor {
        return new WorkflowProcessor(id, this.redisClient);
    }

}
