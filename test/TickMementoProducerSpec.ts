import "reflect-metadata";
import { TickMementoProducer } from "./../scripts/ticks/TickMementoProducer";
import expect = require("expect.js");
import Tick from "../scripts/ticks/Tick";

describe("Given a tick memento producer", () => {

    let subject: TickMementoProducer;

    beforeEach(() => {
        subject = new TickMementoProducer({
            "Mock2": [
                new Tick(new Date(1)),
                new Tick(new Date(2))
            ],
            "Mock": null
        });
    });

    context("when a projection has emitted some ticks", () => {
        it("should add those ticks to the memento", () => {
            expect(subject.produce({
                type: "Mock2", payload: {count: 10}, timestamp: new Date(20)
            })).to.eql({ projectionState: {count: 10}, ticks: [
                { clock: new Date(1), state: undefined}, { clock: new Date(2), state: undefined }
            ]});
        });
    });

    context("when a projection has not emitted ticks", () => {
        it("should not add ticks to the memento", () => {
            expect(subject.produce({
                type: "Mock", payload: {count: 10}, timestamp: new Date(20)
            })).to.eql({ projectionState: {count: 10}});
        });
    });
});
