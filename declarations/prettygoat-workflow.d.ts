import {IModule, IProjectionRegistry, ValueOrPromise, IReadModel, IReadModelDefinition} from "prettygoat";
import IServiceLocator from "../../prettygoat/scripts/bootstrap/IServiceLocator";

export class WorkflowModule implements IModule {
    register(registry: IProjectionRegistry, serviceLocator?: IServiceLocator, overrides?: any);
}

export class SideEffect {
    action: SideEffectAction;
    args: object;
    policy: SideEffectPolicies;

    constructor(action: SideEffectAction, args: object, policy: SideEffectPolicies);
}

export type SideEffectAction = (args?: object) => ValueOrPromise<void>;

export enum SideEffectPolicies {
    SKIP,
    STOP
}

export type IWorkflow = IReadModel;

export type IWorkflowDefinition = IReadModelDefinition;

export interface IWorkflowProcessorFactory {
    processorFor(id: string): IWorkflowProcessor;
}

export interface IWorkflowProcessor {
    process(sideEffect: SideEffect, timestamp: Date): Promise<void>;
}
