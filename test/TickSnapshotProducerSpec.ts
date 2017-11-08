import "reflect-metadata";
import { TickSnapshotProducer } from "./../scripts/ticks/TickSnapshotProducer";
import expect = require("expect.js");
import {Mock} from "typemoq";
import {Snapshot, IIdempotenceFilter} from "prettygoat";
import Tick from "../scripts/ticks/Tick";

describe("Given a tick snapshot producer", () => {

    let subject: TickSnapshotProducer;

    beforeEach(() => {
        let filter = Mock.ofType<IIdempotenceFilter>();
        filter.setup(f => f.serialize()).returns(() => [
            {id: "test", timestamp: new Date(2)}
        ]);
        subject = new TickSnapshotProducer({
            "Mock": filter.object,
            "Mock2": filter.object
        }, {
            "Mock2": [
                new Tick(new Date(1)),
                new Tick(new Date(2))
            ],
            "Mock": null
        });
    });

    context("when a projection has emitted some ticks", () => {
        it("should snapshot them", () => {
            expect(subject.produce({
                type: "Mock2", payload: {count: 10}, timestamp: new Date(20)
            })).to.eql(new Snapshot<any>({ projectionState: {count: 10}, ticks: [
                { clock: new Date(1), state: undefined}, { clock: new Date(2), state: undefined }
            ]}, new Date(20), [{id: "test", timestamp: new Date(2)}]));
        });
    });

    context("when a projection has not emitted ticks", () => {
        it("should not snapshot them", () => {
            expect(subject.produce({
                type: "Mock", payload: {count: 10}, timestamp: new Date(20)
            })).to.eql(new Snapshot({ projectionState: {count: 10}}, new Date(20), [{id: "test", timestamp: new Date(2)}]));
        });
    });
});
