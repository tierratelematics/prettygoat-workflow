import {ValueOrPromise} from "prettygoat";

export type SideEffectAction = () => ValueOrPromise<void>;

export enum SideEffectPolicies {
    SKIP,
    ABORT
}
