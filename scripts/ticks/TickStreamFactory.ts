import {inject, injectable} from "inversify";
import {Observable, Subscription} from "rxjs";
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
                @inject("SnapshotTicksHolder") private ticksHolder: Dictionary<Tick[]>,
                @inject("SnapshotsHolder") private snapshotsHolder: Dictionary<Snapshot>) {

    }

    from(query: ProjectionQuery, idempotence: IIdempotenceFilter, backpressureGate: Observable<string>): Observable<Event> {
        this.ticksHolder[query.name] = this.ticksHolder[query.name] || [];
        return this.combineStreams(
            query,
            this.streamFactory.from(query, idempotence, backpressureGate),
            this.tickSchedulerHolder[query.name].from(),
            this.dateRetriever,
            this.logger.createChildLogger(query.name)
        );
    }

    private restoreTicks(projection: string, logger: ILogger) {
        let tickScheduler = this.tickSchedulerHolder[projection];
        let snapshottedTicks = this.snapshotsHolder[projection] ? this.snapshotsHolder[projection].memento.ticks : null;
        if (snapshottedTicks && snapshottedTicks.length) {
            forEach(snapshottedTicks, tick => {
                tickScheduler.schedule(new Date(tick.clock), tick.state);
                logger.debug(`Restoring tick for date ${tick.clock}`);
            });
        }
    }

    private combineStreams(query: ProjectionQuery, events: Observable<Event>, ticks: Observable<Event>, dateRetriever: IDateRetriever, logger: ILogger) {
        return Observable.create(observer => {
            let scheduler = new HistoricalScheduler();
            let snapshotTicks = this.ticksHolder[query.name];
            let subscription = new Subscription();

            ticks.subscribe((event: Event<Tick>) => {
                logger.debug(`Scheduling tick to ${event.payload.clock.toISOString()}`);
                subscription.add(scheduler.schedule(() => {
                    observer.next(event);
                    remove(this.ticksHolder[query.name], tick => tick === event.payload);
                }, +event.payload.clock));
                snapshotTicks.push(event.payload);
            });

            subscription.add(events.subscribe(event => {
                if (event.type === SpecialEvents.REALTIME)
                   subscription.add(Observable.interval(1000).subscribe(() => scheduler.advanceTo(+this.dateRetriever.getDate())));
                scheduler.schedule(() => {
                    observer.next(event);
                }, +event.timestamp);
                try {
                    scheduler.advanceTo(+event.timestamp);
                } catch (error) {
                    observer.error(error);
                }
            }, error => observer.error(error), () => observer.complete()));

            // TODO: think a new way to restore the ticks not in this place
            this.restoreTicks(query.name, logger);

            return subscription;
        });
    }
}
