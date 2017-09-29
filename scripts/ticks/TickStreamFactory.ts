import {inject, injectable} from "inversify";
import {Observable} from "rxjs";
import {
    IDateRetriever, IStreamFactory, Dictionary, IProjection,
    Snapshot, SpecialEvents, Event
} from "prettygoat";
import Tick from "./Tick";
import {ITickScheduler} from "./TickScheduler";
import HistoricalScheduler from "./HistoricalScheduler";

@injectable()
export class TickStreamFactory implements IStreamFactory {

    constructor(@inject("IStreamFactory") private streamFactory: IStreamFactory,
                @inject("ITickSchedulerHolder") private tickSchedulerHolder: Dictionary<ITickScheduler>,
                @inject("IDateRetriever") private dateRetriever: IDateRetriever) {

    }

    generate(projection: IProjection<any>, snapshot: Snapshot<any>, completions: Observable<any>): Observable<Event> {
        return this.combineStreams(
            this.streamFactory.generate(projection, snapshot, completions),
            this.tickSchedulerHolder[projection.name].generate(projection),
            this.dateRetriever
        );
    }

    private combineStreams(events: Observable<Event>, ticks: Observable<Event>, dateRetriever: IDateRetriever) {
        let realtime = false;
        let scheduler = new HistoricalScheduler();

        return Observable.create(observer => {
            let subscription = events.subscribe(event => {
                if (event.type === SpecialEvents.REALTIME) {
                    if (!realtime) {
                        scheduler.flush();
                    }
                    realtime = true;
                }
                if (realtime) {
                    observer.next(event);
                } else {
                    scheduler.schedule(() => {
                        observer.next(event);
                    }, +event.timestamp);
                    try {
                        scheduler.advanceTo(+event.timestamp);
                    } catch (error) {
                        observer.error(error);
                    }
                }
            }, error => observer.error(error), () => observer.complete());

            subscription.add(ticks.subscribe((event: Event<Tick>) => {
                if (realtime || event.payload.clock > dateRetriever.getDate()) {
                    Observable.empty().delay(event.timestamp).subscribe(null, null, () => observer.next(event));
                } else {
                    scheduler.schedule(() => {
                        observer.next(event);
                    }, +event.payload.clock);
                }
            }));

            return subscription;
        });
    }
}
