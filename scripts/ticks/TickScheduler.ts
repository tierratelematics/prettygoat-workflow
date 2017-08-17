import {injectable, inject} from "inversify";
import {Subject, Observable} from "rxjs";
import Tick from "./Tick";
import {IDateRetriever, Event, IStreamFactory} from "prettygoat";
import * as moment from "moment";

export interface ITickScheduler extends IStreamFactory {
    schedule(dueTime: number | Date, state?: string | object);
}

@injectable()
class TickScheduler implements ITickScheduler {

    private subject = new Subject<Event>();

    constructor(@inject("IDateRetriever") private dateRetriever: IDateRetriever) {

    }

    schedule(dueTime: number | Date, state?: string | object) {
        let dueDate = dueTime instanceof Date ? dueTime : this.calculateDueDate(<number>dueTime);
        this.subject.next({
            type: "Tick",
            payload: new Tick(dueDate, state),
            timestamp: dueDate
        });
    }

    from(lastEvent: Date): Observable<Event> {
        return this.subject;
    }

    private calculateDueDate(dueTime: number): Date {
        return moment(this.dateRetriever.getDate()).add(dueTime, "milliseconds").toDate();
    }
}

export default TickScheduler
