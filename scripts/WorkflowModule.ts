import { TickMementoProducer } from "./ticks/TickMementoProducer";
import {
    IModule, IProjectionRegistry, IServiceLocator, Dictionary, IProjectionFactoryExtender,
    IStreamFactory, IMementoProducer
} from "prettygoat";
import {interfaces} from "inversify";
import {IWorkflowProcessorFactory, WorkflowProcessorFactory} from "./workflow/WorkflowProcessorFactory";
import {ITickScheduler, default as TickScheduler} from "./ticks/TickScheduler";
import {VirtualTimeExtender} from "./ticks/VirtualTimeExtender";
import {TickStreamFactory} from "./ticks/TickStreamFactory";
import Tick from "./ticks/Tick";
import { TransactionLog, ITransactionLog } from "./workflow/TransactionLog";

class WorkflowModule implements IModule {

    modules = (container: interfaces.Container) => {
        container.bind<IWorkflowProcessorFactory>("IWorkflowProcessorFactory").to(WorkflowProcessorFactory).inSingletonScope();
        container.bind<Dictionary<ITickScheduler>>("ITickSchedulerHolder").toConstantValue({});
        container.bind<ITickScheduler>("ITickScheduler").to(TickScheduler);
        container.bind<interfaces.Factory<ITickScheduler>>("Factory<ITickScheduler>").toAutoFactory<ITickScheduler>("ITickScheduler");
        container.bind<IProjectionFactoryExtender>("IProjectionFactoryExtender").to(VirtualTimeExtender).inSingletonScope();
        container.rebind<IStreamFactory>("IProjectionStreamFactory").to(TickStreamFactory).inSingletonScope();
        container.rebind<IMementoProducer<any>>("IMementoProducer").to(TickMementoProducer).inSingletonScope();
        container.bind<Dictionary<Tick[]>>("SnapshotTicksHolder").toConstantValue({});
        container.bind<ITransactionLog>("ITransactionLog").to(TransactionLog);
        container.bind<interfaces.Factory<ITransactionLog>>("ITransactionLogFactory<Katana>").toAutoFactory<ITransactionLog>("ITransactionLog");
    };

    register(registry: IProjectionRegistry, serviceLocator?: IServiceLocator, overrides?: any) {

    }
}

export default WorkflowModule
