import "reflect-metadata";
import expect = require("expect.js");
import {Mock, IMock, It} from "typemoq";
import {Subject, Subscription} from "rxjs";
import TickScheduler, {ITickScheduler} from "../scripts/ticks/TickScheduler";
import {IStreamFactory, Event, SpecialEvents, Dictionary, IDateRetriever} from "prettygoat";
import {TickStreamFactory} from "../scripts/ticks/TickStreamFactory";
import Tick from "../scripts/ticks/Tick";

describe("TimeTick, given a tick scheduler and a projection", () => {

    let tickScheduler: ITickScheduler;
    let streamData: Subject<Event>;
    let notifications: Event[];
    let dateRetriever: IMock<IDateRetriever>;
    let stream: IMock<IStreamFactory>;
    let subject: IStreamFactory;
    let ticksHolder: Dictionary<Tick[]>;
    let subscription: Subscription;

    beforeEach(() => {
        notifications = [];
        ticksHolder = {};
        dateRetriever = Mock.ofType<IDateRetriever>();
        dateRetriever.setup(d => d.getDate()).returns(() => new Date(3000));
        tickScheduler = new TickScheduler(dateRetriever.object);
        streamData = new Subject<Event>();
        stream = Mock.ofType<IStreamFactory>();
        stream.setup(s => s.from(It.isAny(), It.isAny(), It.isAny())).returns(() => streamData);
        subject = new TickStreamFactory(stream.object, {
            "Mock": tickScheduler
        }, dateRetriever.object, ticksHolder, {});
        subscription = subject.from({name: "Mock", manifests: []}, null, null).subscribe(event => notifications.push(event));
    });

    afterEach(() => subscription.unsubscribe());

    context("when an event is read out of order", () => {
        it("should be processed instantly", () => {
            streamData.next({
                type: "TickTrigger", payload: null, timestamp: new Date(60)
            });
            streamData.next({
                type: "Unordered", payload: null, timestamp: new Date(50)
            });
            streamData.next({
                type: "TickTrigger", payload: null, timestamp: new Date(70)
            });

            expect(notifications[0].type).to.eql("TickTrigger");
            expect(notifications[1].type).to.eql("Unordered");
            expect(notifications[2].type).to.eql("TickTrigger");
            expect(notifications[2].timestamp).to.eql(new Date(70));
        });
    });

    context("when a new tick is scheduled", () => {
        context("when the projection is still fetching historical events", () => {
            it("should schedule the tick after the other events", () => {
                streamData.next({
                    type: "TickTrigger", payload: null, timestamp: new Date(60)
                });
                tickScheduler.schedule(new Date(300));
                tickScheduler.schedule(new Date(100));
                streamData.next({
                    type: "OtherEvent", payload: null, timestamp: new Date(200)
                });
                streamData.next({
                    type: "OtherEvent", payload: null, timestamp: new Date(400)
                });

                expect(notifications[0].type).to.eql("TickTrigger");
                expect(notifications[1].type).to.eql("Tick");
                expect(notifications[1].payload.clock).to.eql(new Date(100));
                expect(notifications[2].type).to.eql("OtherEvent");
                expect(notifications[3].type).to.eql("Tick");
            });
        });

        context("when an another tick has been scheduled with the same delay", () => {
            it("should process both", () => {
                streamData.next({
                    type: "TickTrigger", payload: null, timestamp: new Date(60)
                });
                tickScheduler.schedule(new Date(100));
                tickScheduler.schedule(new Date(100));
                streamData.next({
                    type: "OtherEvent", payload: null, timestamp: new Date(200)
                });

                expect(notifications[0].type).to.eql("TickTrigger");
                expect(notifications[1].type).to.eql("Tick");
                expect(notifications[2].type).to.eql("Tick");
                expect(notifications).to.have.length(4);
            });
        });

        context("when it's past the system clock", () => {
            it("should delay it in the future", (done) => {
                dateRetriever.reset();
                dateRetriever.setup(d => d.getDate()).returns(() => new Date(300));
                streamData.next({
                    type: SpecialEvents.REALTIME, payload: null, timestamp: new Date(110)
                });
                tickScheduler.schedule(new Date(500));
                dateRetriever.reset();
                dateRetriever.setup(d => d.getDate()).returns(() => new Date(1000));

                expect(notifications[1]).not.to.be.ok();
                setTimeout(() => {
                    expect(notifications[1].payload.clock).to.eql(new Date(500));
                    done();
                }, 1000);
            });
        });

        context("when it's scheduled with a state", () => {
            it("should carry it when accessing the event", () => {
                tickScheduler.schedule(new Date(100), "state");
                streamData.next({
                    type: "OtherEvent", payload: null, timestamp: new Date(300)
                });

                expect(notifications[0].payload.state).to.be("state");
            });
            it("should be possible to pass an object", () => {
                tickScheduler.schedule(new Date(100), {count: 10});
                streamData.next({
                    type: "OtherEvent", payload: null, timestamp: new Date(300)
                });

                expect(notifications[0].payload.state).to.eql({count: 10});
            });
        });

        context("when the projection is going real time", () => {
            it("should flush the buffer of ticks", () => {
                tickScheduler.schedule(new Date(100));
                streamData.next({
                    type: SpecialEvents.REALTIME, payload: null, timestamp: new Date(110)
                });

                expect(notifications[0].type).to.eql("Tick");
                expect(notifications[0].payload.clock).to.eql(new Date(100));
                expect(notifications[1].type).to.eql(SpecialEvents.REALTIME);
            });
        });

        context("when the projection is fetching real time events", () => {
            beforeEach(() => {
                dateRetriever.reset();
                dateRetriever.setup(d => d.getDate()).returns(() => new Date(100));
                streamData.next({
                    type: SpecialEvents.REALTIME, payload: null, timestamp: new Date(110)
                });
                tickScheduler.schedule(new Date(150));
                dateRetriever.reset();
                dateRetriever.setup(d => d.getDate()).returns(() => new Date(1000));
            });
            it("should schedule the tick in the future", (done) => {
                expect(notifications[0].type).to.eql(SpecialEvents.REALTIME);
                expect(notifications[1]).not.to.be.ok();
                setTimeout(() => {
                    expect(notifications[1].payload.clock).to.eql(new Date(150));
                    done();
                }, 1000);
            });

            it("should cache those ticks for snapshots", (done) => {
                expect(ticksHolder["Mock"]).to.have.length(1);
                setTimeout(() => {
                    expect(ticksHolder["Mock"]).to.have.length(0);
                    done();
                }, 1000);
            });
        });
    });
});
