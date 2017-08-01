import {IWorkflowProcessor, WorkflowProcessor} from "./WorkflowProcessor";
import {inject, injectable} from "inversify";
import {ILogger} from "prettygoat";

export interface IWorkflowProcessorFactory {
    processorFor(id: string): IWorkflowProcessor;
}

@injectable()
export class WorkflowProcessorFactory implements IWorkflowProcessorFactory {

    constructor(@inject("RedisClient") private redisClient, @inject("ILogger") private logger: ILogger) {

    }

    processorFor(id: string): IWorkflowProcessor {
        return new WorkflowProcessor(id, this.redisClient, this.logger);
    }

}
