import "reflect-metadata";
import expect = require("expect.js");
import {IMock, Mock, Times, It} from "typemoq";
import {IWorkflowProcessor, WorkflowProcessor} from "../scripts/WorkflowProcessor";
import {Redis} from "ioredis";
import {SideEffect, SideEffectAction, SideEffectPolicies} from "../scripts/SideEffect";

describe("Given a workflow processor", () => {
    let subject: IWorkflowProcessor;
    let redis: IMock<Redis>;
    let action: IMock<Function>;

    beforeEach(() => {
        action = Mock.ofType<Function>();
        redis = Mock.ofType<Redis>();
        subject = new WorkflowProcessor("test", redis.object);
    });

    context("when a side effect needs to be processed", () => {
        beforeEach(() => {
            action.setup(a => a(It.isAny())).returns(() => Promise.resolve());
        });
        context("when it's already been processed in the past", () => {
            beforeEach(() => {
                redis.setup(r => r.get("prettygoat_workflow:transactions:test")).returns(() => JSON.stringify(new Date(8000)));
            });
            it("should not be processed", async () => {
                await subject.process(new SideEffect(<SideEffectAction>action.object), new Date(6000));

                action.verify(s => s(), Times.never());
            });
        });

        context("when it has not been processed yet", () => {
            beforeEach(() => {
                redis.setup(r => r.get("prettygoat_workflow:transactions:test")).returns(() => JSON.stringify(new Date(4000)));
            });
            it("should be processed", async () => {
                await subject.process(new SideEffect(<SideEffectAction>action.object), new Date(6000));

                action.verify(a => a(It.isAny()), Times.once());
            });

            it("should commit the side effect to the transactions log", async () => {
                await subject.process(new SideEffect(<SideEffectAction>action.object), new Date(6000));

                redis.verify(r => r.set("prettygoat_workflow:transactions:test", JSON.stringify(new Date(6000))), Times.once());
            });
        });
    });

    context("when a side effect is not provided", () => {
        beforeEach(() => {
            redis.setup(r => r.get("prettygoat_workflow:transactions:test")).returns(() => JSON.stringify(null));
        });
        it("should skip the transactions log", async () => {
            await subject.process(null, new Date(6000));

            redis.verify(r => r.set("prettygoat_workflow:transactions:test", JSON.stringify(new Date(6000))), Times.never());
        });
    });

    context("when something bad happens during a side effect", () => {
        beforeEach(() => {
            action.setup(a => a(It.isAny())).returns(() => Promise.reject(new Error("Bad side effect")));
            redis.setup(r => r.get("prettygoat_workflow:transactions:test")).returns(() => JSON.stringify((new Date(4000))));
        });
        context("and a skip policy is set", () => {
            it("should process the next event", async () => {
                try {
                    await subject.process(new SideEffect(<SideEffectAction>action.object, null, SideEffectPolicies.SKIP), new Date(6000));
                } catch (error) {
                    expect(true).to.be(false); // Just a way to fail an assert if an error must not happen
                }
            });
        });

        context("and an abort policy is set", () => {
            it("should abort the workflow", async () => {
                try {
                    await subject.process(new SideEffect(<SideEffectAction>action.object, null, SideEffectPolicies.ABORT), new Date(6000));
                } catch (error) {
                    expect(error.message).to.eql("Bad side effect");
                }
            });

            it("should not commit the transaction log", async () => {
                try {
                    await subject.process(new SideEffect(<SideEffectAction>action.object, null, SideEffectPolicies.ABORT), new Date(6000));
                } catch (error) {
                    redis.verify(r => r.set("prettygoat_workflow:transactions:test", JSON.stringify(new Date(6000))), Times.never());
                }
            });
        });
    });
});
