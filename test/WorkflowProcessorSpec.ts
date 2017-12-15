import "reflect-metadata";
import expect = require("expect.js");
import {IMock, Mock, Times, It} from "typemoq";
import {IWorkflowProcessor, WorkflowProcessor} from "../scripts/workflow/WorkflowProcessor";
import {SideEffectAction, SideEffectPolicies} from "../scripts/workflow/SideEffect";
import {ITransactionLog} from "../scripts/workflow/TransactionLog";

describe("Given a workflow processor", () => {
    let subject: IWorkflowProcessor;
    let action: IMock<SideEffectAction>;
    let transactionLog: IMock<ITransactionLog>;

    beforeEach(() => {
        action = Mock.ofType<SideEffectAction>();
        transactionLog = Mock.ofType<ITransactionLog>();
        subject = new WorkflowProcessor("test", transactionLog.object);
    });

    context("when a side effect needs to be processed", () => {
        beforeEach(() => {
            action.setup(a => a()).returns(() => Promise.resolve());
        });
        context("when it's already been processed in the past", () => {
            beforeEach(() => {
                transactionLog.setup(r => r.read()).returns(() => Promise.resolve({ lastTransaction: new Date(8000), eventId: null }));
            });
            it("should not be processed", async () => {
                await subject.process(action.object, new Date(6000));

                action.verify(s => s(), Times.never());
            });
        });

        context("when has the same timestamp of a processed side effect", () => {
            beforeEach(() => {
                transactionLog.setup(r => r.read()).returns(() => Promise.resolve({ lastTransaction: new Date(8000), eventId: "test-1" }));
            });
            context("when it has a different event id", () => {
                it("should be processed", async () => {
                    await subject.process(action.object, new Date(8000), "test-2");
                    
                    action.verify(s => s(), Times.once());
                });
            });

            context("when it has not a different event id", () => {
                it("should not be processed", async () => {
                    await subject.process(action.object, new Date(8000), "test-1");
                    
                    action.verify(s => s(), Times.never());
                });
            });
        });

        context("when it has not been processed yet", () => {
            beforeEach(() => {
                transactionLog.setup(r => r.read()).returns(() => Promise.resolve({ lastTransaction: new Date(4000), eventId: null }));
            });
            it("should be processed", async () => {
                await subject.process(action.object, new Date(6000));

                action.verify(a => a(), Times.once());
            });

            it("should commit the side effect to the transactions log", async () => {
                await subject.process(action.object, new Date(6000));

                transactionLog.verify(r => r.commit(It.isValue(new Date(6000))), Times.once());
            });
        });
    });

    context("when a side effect is not provided", () => {
        beforeEach(() => {
            transactionLog.setup(r => r.read()).returns(() => Promise.resolve(null));
        });
        it("should skip the transactions log", async () => {
            await subject.process(null, new Date(6000));

            transactionLog.verify(r => r.commit(It.isValue(new Date(6000))), Times.never());
        });
    });

    context("when something bad happens during a side effect", () => {
        beforeEach(() => {
            action.setup(a => a()).returns(() => Promise.reject(new Error("Bad side effect")));
            transactionLog.setup(r => r.read()).returns(() => Promise.resolve({ lastTransaction: new Date(4000), eventId: null }));
        });
        context("and a skip policy is set", () => {
            it("should process the next event", async () => {
                try {
                    await subject.process(action.object, new Date(6000), null, SideEffectPolicies.SKIP);
                } catch (error) {
                    expect(true).to.be(false); // Just a way to fail an assert if an error must not happen
                }
            });
        });

        context("and an abort policy is set", () => {
            it("should abort the workflow", async () => {
                try {
                    await subject.process(action.object, new Date(6000), null, SideEffectPolicies.ABORT);
                } catch (error) {
                    expect(error.message).to.eql("Bad side effect");
                }
            });

            it("should not commit the transaction log", async () => {
                try {
                    await subject.process(action.object, new Date(6000), null, SideEffectPolicies.ABORT);
                } catch (error) {
                    transactionLog.verify(r => r.commit(It.isValue(new Date(6000))), Times.never());
                }
            });
        });
    });
});
