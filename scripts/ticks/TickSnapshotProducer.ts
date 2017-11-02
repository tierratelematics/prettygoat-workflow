import {inject, injectable} from "inversify";
import {IIdempotenceFilter, Dictionary, Snapshot, Event, ISnapshotProducer} from "prettygoat";
import Tick from "./Tick";

@injectable()
export class TickSnapshotProducer implements ISnapshotProducer {

    constructor(@inject("IdempotenceFilterHolder") private filterHolder: Dictionary<IIdempotenceFilter>,
                @inject("RealtimeTicksHolder") private ticksHolder: Dictionary<Tick[]>) {

    }

    produce<T>(event: Event): Snapshot<T> {
        let ticks = this.ticksHolder[event.type];
        let snapshotState: any = { state: event.payload };
        if (ticks && ticks.length) snapshotState.ticks = ticks;
        return new Snapshot(snapshotState, event.timestamp, this.filterHolder[event.type].serialize());
    }
}
