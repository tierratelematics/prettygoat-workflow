import {IProjectionFactoryExtender, Dictionary} from "prettygoat";
import {ITickScheduler} from "./TickScheduler";
import {inject, interfaces} from "inversify";

export interface IVirtualTime {
    onSchedulerReceived(service: ITickScheduler);
}

export class VirtualTimeExtender implements IProjectionFactoryExtender {

    constructor(@inject("Factory<ITickScheduler>") private tickSchedulerFactory: interfaces.Factory<ITickScheduler>,
                @inject("ITickSchedulerHolder") private holder: Dictionary<ITickScheduler>) {
    }

    extend(name: string, definition: any) {
        let tickScheduler = <ITickScheduler>this.tickSchedulerFactory();
        this.holder[name] = tickScheduler;
        if (definition.onSchedulerReceived) definition.onSchedulerReceived(tickScheduler);
    }
}
