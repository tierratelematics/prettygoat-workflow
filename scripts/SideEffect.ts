import {ValueOrPromise} from "prettygoat";

export class SideEffect {
    action: SideEffectAction;
    args: object;
    policy: SideEffectPolicies;

    constructor(action: SideEffectAction, args: object = {}, policy = SideEffectPolicies.STOP) {
        this.action = action;
        this.args = args;
        this.policy = policy;
    }
}

export type SideEffectAction = (args?: object) => ValueOrPromise<void>;

export enum SideEffectPolicies {
    SKIP,
    STOP
}
