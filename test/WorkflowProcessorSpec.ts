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
                redis.setup(r => r.get("prettygoat_workflow:transactions:test")).returns(() => new Date(8000).toISOString());
            });
            it("should not be processed", async () => {
                await subject.process(new SideEffect(<SideEffectAction>action.object), new Date(6000));

                action.verify(s => s(), Times.never());
            });
        });

        context("when it has not been processed yet", () => {
            beforeEach(() => {
                redis.setup(r => r.get("prettygoat_workflow:transactions:test")).returns(() => new Date(4000).toISOString());
            });
            it("should be processed", () => {
                subject.process(new SideEffect(<SideEffectAction>action.object), new Date(6000));

                action.verify(s => s(), Times.once());
            });

            it("should commit the side effect to the transactions log", () => {
                subject.process(new SideEffect(<SideEffectAction>action.object), new Date(6000));

                redis.verify(r => r.set("prettygoat_workflow:transactions:test", new Date(6000).toISOString()), Times.once());
            });
        });
    });

    context("when a side effect is not provided", () => {
        it("should skip the transactions log", () => {
            subject.process(null, new Date(6000));

            redis.verify(r => r.set("prettygoat_workflow:transactions:test", new Date(6000).toISOString()), Times.never());
        });
    });

    context("when something bad happens during a side effect", () => {
        beforeEach(() => {
            action.setup(a => a(It.isAny())).returns(() => Promise.reject(new Error()));
            redis.setup(r => r.get("prettygoat_workflow:transactions:test")).returns(() => new Date(4000).toISOString());
        });
        context("and a skip policy is set", () => {
            it("should process the next event", async () => {
                await subject.process(new SideEffect(<SideEffectAction>action.object, null, SideEffectPolicies.SKIP), new Date(6000));

                action.verify(s => s(), Times.once());
            });
        });

        context("and a stop policy is set", () => {
            it("should stop the workflow", () => {
                expect(async () => {
                    await subject.process(new SideEffect(<SideEffectAction>action.object, null, SideEffectPolicies.STOP), new Date(6000));
                }).to.throwError();
            });
        });
    });
});
