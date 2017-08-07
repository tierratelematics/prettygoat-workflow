import {injectable} from "inversify";
import {IProjection, IProjectionDefinition} from "prettygoat";
import {IVirtualTime} from "../../scripts/ticks/VirtualTimeExtender";
import {ITickScheduler} from "../../scripts/ticks/TickScheduler";

@injectable()
class ExtendedProjectionDefinition implements IProjectionDefinition<number>, IVirtualTime {

    constructor() {

    }

    define(): IProjection<number> {
        return {
            name: "Mock",
            definition: {
                $init: () => 10,
                TestEvent: (s, e: number) => s + e
            },
            publish: {
                "Test": {}
            }
        };
    }

    onSchedulerReceived(service: ITickScheduler) {

    }

}

export default ExtendedProjectionDefinition
