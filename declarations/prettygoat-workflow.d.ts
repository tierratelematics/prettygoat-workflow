import {
    IModule, IProjectionRegistry, ValueOrPromise, IReadModel, IReadModelDefinition,
    IStreamFactory, IServiceLocator
} from "prettygoat";

export class WorkflowModule implements IModule {
    register(registry: IProjectionRegistry, serviceLocator?: IServiceLocator, overrides?: any);
}

export type SideEffectAction = () => ValueOrPromise<void>;

export enum SideEffectPolicies {
    SKIP,
    ABORT
}

export type IWorkflow<T> = IReadModel<T>;

export type IWorkflowDefinition<T> = IReadModelDefinition<T>;

export interface IWorkflowProcessorFactory {
    processorFor(id: string): IWorkflowProcessor;
}

export interface IWorkflowProcessor {
    process(action: SideEffectAction, timestamp: Date, policy?: SideEffectPolicies): Promise<void>;
}

export interface ITickScheduler extends IStreamFactory {
    schedule(dueTime: number | Date, state?: string | object);
}

export class Tick {
    state: string | object;
    clock: Date | number;

    constructor(clock: Date, state?: string | object);
}
