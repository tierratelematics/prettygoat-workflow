import {IWorkflowProcessor, WorkflowProcessor} from "./WorkflowProcessor";
import {inject, injectable} from "inversify";
import {ILogger} from "prettygoat";
import {ITransactionLog} from "./TransactionLog";

export interface IWorkflowProcessorFactory {
    processorFor(id: string): IWorkflowProcessor;
}

@injectable()
export class WorkflowProcessorFactory implements IWorkflowProcessorFactory {

    constructor(@inject("ILogger") private logger: ILogger,
                @inject("ITransactionLogFactory") private transactionLogFactory: () => ITransactionLog) {
        this.logger = this.logger.createChildLogger("WorkflowProcessor");
    }

    processorFor(id: string): IWorkflowProcessor {
        let transactionLog = this.transactionLogFactory();
        transactionLog.setLogId(id);
        return new WorkflowProcessor(id, transactionLog, this.logger.createChildLogger(id));
    }

}
