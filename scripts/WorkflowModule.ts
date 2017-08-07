import {IModule, IProjectionRegistry, IServiceLocator} from "prettygoat";
import {interfaces} from "inversify";
import {IWorkflowProcessorFactory, WorkflowProcessorFactory} from "./workflow/WorkflowProcessorFactory";

class WorkflowModule implements IModule {

    modules = (container: interfaces.Container) => {
        container.bind<IWorkflowProcessorFactory>("IWorkflowProcessorFactory").to(WorkflowProcessorFactory).inSingletonScope();
    };

    register(registry: IProjectionRegistry, serviceLocator?: IServiceLocator, overrides?: any) {

    }
}

export default WorkflowModule
