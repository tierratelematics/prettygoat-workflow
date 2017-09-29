import {
    IModule, IProjectionRegistry, IServiceLocator, Dictionary, IProjectionFactoryExtender,
    IStreamFactory
} from "prettygoat";
import {interfaces} from "inversify";
import {IWorkflowProcessorFactory, WorkflowProcessorFactory} from "./workflow/WorkflowProcessorFactory";
import {ITickScheduler, default as TickScheduler} from "./ticks/TickScheduler";
import {VirtualTimeExtender} from "./ticks/VirtualTimeExtender";
import {TickStreamFactory} from "./ticks/TickStreamFactory";

class WorkflowModule implements IModule {

    modules = (container: interfaces.Container) => {
        container.bind<IWorkflowProcessorFactory>("IWorkflowProcessorFactory").to(WorkflowProcessorFactory).inSingletonScope();
        container.bind<Dictionary<ITickScheduler>>("ITickSchedulerHolder").toConstantValue({});
        container.bind<ITickScheduler>("ITickScheduler").to(TickScheduler);
        container.bind<interfaces.Factory<ITickScheduler>>("Factory<ITickScheduler>").toAutoFactory<ITickScheduler>("ITickScheduler");
        container.bind<IProjectionFactoryExtender>("IProjectionFactoryExtender").to(VirtualTimeExtender).inSingletonScope();
        container.rebind<IStreamFactory>("IProjectionStreamFactory").to(TickStreamFactory).inSingletonScope();
    };

    register(registry: IProjectionRegistry, serviceLocator?: IServiceLocator, overrides?: any) {

    }
}

export default WorkflowModule
