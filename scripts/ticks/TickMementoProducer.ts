import {inject, injectable} from "inversify";
import {Dictionary, Event, IMementoProducer} from "prettygoat";
import Tick from "./Tick";

@injectable()
export class TickMementoProducer implements IMementoProducer<any> {

    constructor(@inject("SnapshotTicksHolder") private ticksHolder: Dictionary<Tick[]>) {

    }

    produce(event: Event): any {
        let ticks = this.ticksHolder[event.type];
        let memento: any = { projectionState: event.payload };
        if (ticks && ticks.length) memento.ticks = ticks;
        return memento;
    }
}
