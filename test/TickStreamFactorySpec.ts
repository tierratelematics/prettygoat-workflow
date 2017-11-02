import "reflect-metadata";
import expect = require("expect.js");
import {Mock, IMock, It, Times} from "typemoq";
import {Subject, Observable} from "rxjs";
import {ITickScheduler} from "../scripts/ticks/TickScheduler";
import {IStreamFactory, Event, Dictionary, IDateRetriever, Snapshot} from "prettygoat";
import {TickStreamFactory} from "../scripts/ticks/TickStreamFactory";
import Tick from "../scripts/ticks/Tick";

describe("TickStreamFactory, given a tick scheduler and a projection", () => {

    let tickScheduler: IMock<ITickScheduler>;
    let streamData: Subject<Event>;
    let dateRetriever: IMock<IDateRetriever>;
    let stream: IMock<IStreamFactory>;
    let subject: IStreamFactory;
    let ticksHolder: Dictionary<Tick[]>;

    beforeEach(() => {
        ticksHolder = {};
        dateRetriever = Mock.ofType<IDateRetriever>();
        tickScheduler = Mock.ofType<ITickScheduler>();
        streamData = new Subject<Event>();
        stream = Mock.ofType<IStreamFactory>();
        stream.setup(s => s.from(It.isAny(), It.isAny(), It.isAny())).returns(() => streamData);
        tickScheduler.setup(t => t.from()).returns(() => Observable.empty());
        subject = new TickStreamFactory(stream.object, {
            "Mock": tickScheduler.object,
            "Mock2": tickScheduler.object
        }, dateRetriever.object, ticksHolder, {
            "Mock": new Snapshot<any>({ state: null, ticks: [
                {clock: new Date(1).toISOString(), state: { test: "20"}},
                {clock: new Date(2).toISOString()} 
            ]}, new Date(10)),
            "Mock2": null
        });
    });

    context("when the stream is initialized", () => {
        context("when some ticks are present in a snapshot", () => {
            it("should reschedule them", () => {
                subject.from({name: "Mock", manifests: []}, null, null).subscribe();

                tickScheduler.verify(t => t.schedule(It.isValue(new Date(1)), It.isValue({test: "20"})), Times.once());
                tickScheduler.verify(t => t.schedule(It.isValue(new Date(2)), undefined), Times.once());
            });
        });

        context("when no ticks are present in a snapshot", () => {
            it("should not schedule any ticks", () => {
                subject.from({name: "Mock2", manifests: []}, null, null).subscribe();

                tickScheduler.verify(t => t.schedule(It.isAny()), Times.never());
            });
        });
    });
});
