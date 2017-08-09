import "reflect-metadata";
import expect = require("expect.js");
import {IMock, Mock, Times, It} from "typemoq";
import {VirtualTimeExtender} from "../scripts/ticks/VirtualTimeExtender";
import {Dictionary} from "prettygoat";
import {ITickScheduler, default as TickScheduler} from "../scripts/ticks/TickScheduler";
import ExtendedProjectionDefinition from "./fixtures/ExtendedProjectionDefinition";

describe("Given a virtual time extender", () => {
    let subject: VirtualTimeExtender;
    let holder: Dictionary<ITickScheduler>;
    let tickScheduler: ITickScheduler;
    let definition: IMock<ExtendedProjectionDefinition>;


    beforeEach(() => {
        definition = Mock.ofType(ExtendedProjectionDefinition);
        tickScheduler = new TickScheduler(null);
        holder = {};
        subject = new VirtualTimeExtender(() => tickScheduler, holder);
    });

    context("when building a projection", () => {
        it("should cache the tick scheduler service", () => {
            subject.extend("Mock", definition.object);

            expect(holder["Mock"]).to.be(tickScheduler);
        });
    });

    context("when a projection has a virtual time", () => {
        it("should pass the tick scheduler service", () => {
            subject.extend("Mock", definition.object);

            definition.verify(d => d.schedulerReceived(It.isValue(tickScheduler)), Times.once());
        });
    });
});
