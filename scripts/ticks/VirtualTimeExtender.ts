import {IProjectionFactoryExtender, Dictionary} from "prettygoat";
import {ITickScheduler} from "./TickScheduler";
import {inject, injectable, interfaces} from "inversify";

export interface IVirtualTime {
    schedulerReceived(service: ITickScheduler);
}

@injectable()
export class VirtualTimeExtender implements IProjectionFactoryExtender {

    constructor(@inject("Factory<ITickScheduler>") private tickSchedulerFactory: interfaces.Factory<ITickScheduler>,
                @inject("ITickSchedulerHolder") private holder: Dictionary<ITickScheduler>) {
    }

    extend(name: string, definition: any) {
        let tickScheduler = <ITickScheduler>this.tickSchedulerFactory();
        this.holder[name] = tickScheduler;
        if (definition.schedulerReceived) definition.schedulerReceived(tickScheduler);
    }
}
