import {inject, injectable} from "inversify";
import {Observable} from "rxjs";
import {
    IDateRetriever,
    IStreamFactory,
    Dictionary,
    ProjectionQuery,
    IIdempotenceFilter,
    SpecialEvents,
    Event,
    ILogger,
    NullLogger,
    LoggingContext,
    Snapshot
} from "prettygoat";
import Tick from "./Tick";
import {ITickScheduler} from "./TickScheduler";
import HistoricalScheduler from "./HistoricalScheduler";
import {remove, forEach} from "lodash";

@injectable()
@LoggingContext("TickStreamFactory")
export class TickStreamFactory implements IStreamFactory {

    @inject("ILogger") private logger: ILogger = NullLogger;

    constructor(@inject("IStreamFactory") private streamFactory: IStreamFactory,
                @inject("ITickSchedulerHolder") private tickSchedulerHolder: Dictionary<ITickScheduler>,
                @inject("IDateRetriever") private dateRetriever: IDateRetriever,
                @inject("RealtimeTicksHolder") private ticksHolder: Dictionary<Tick[]>,
                @inject("SnapshotsHolder") private snapshotsHolder: Dictionary<Snapshot>) {

    }

    from(query: ProjectionQuery, idempotence: IIdempotenceFilter, backpressureGate: Observable<string>): Observable<Event> {
        this.ticksHolder[query.name] = this.ticksHolder[query.name] || [];
        let tickScheduler = this.tickSchedulerHolder[query.name];
        let snapshottedTicks = this.snapshotsHolder[query.name] ? this.snapshotsHolder[query.name].memento.ticks: null;
        if (snapshottedTicks && snapshottedTicks.length) {
            forEach(snapshottedTicks, tick => tickScheduler.schedule(new Date(tick.clock), tick.state));
        }
        return this.combineStreams(
            query,
            this.streamFactory.from(query, idempotence, backpressureGate),
            tickScheduler.from(),
            this.dateRetriever,
            this.logger.createChildLogger(query.name)
        );
    }

    private combineStreams(query: ProjectionQuery, events: Observable<Event>, ticks: Observable<Event>, dateRetriever: IDateRetriever, logger: ILogger) {
        let realtime = false;
        let scheduler = new HistoricalScheduler();
        let realtimeTicks = this.ticksHolder[query.name];

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
                    logger.debug(`Scheduling realtime tick to ${event.payload.clock}`);
                    Observable.empty().delay(event.timestamp).subscribe(null, null, () => observer.next(event));
                    realtimeTicks.push(event.payload);
                } else {
                    logger.debug(`Scheduling tick to ${event.payload.clock}`);
                    scheduler.schedule(() => {
                        observer.next(event);
                    }, +event.payload.clock);
                }
            }));

            return subscription;
        });
    }
}
