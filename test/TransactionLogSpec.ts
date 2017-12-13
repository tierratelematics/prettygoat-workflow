import "reflect-metadata";
import expect = require("expect.js");
import {IMock, Mock, Times} from "typemoq";
import {Redis} from "ioredis";
import {TransactionLog} from "../scripts/workflow/TransactionLog";

describe("Given a transaction log", () => {
    let subject: TransactionLog;
    let redis: IMock<Redis>;

    beforeEach(() => {
        redis = Mock.ofType<Redis>();
        subject = new TransactionLog(redis.object);
        subject.setLogId("myLog");
    });

    context("when the log is requested", () => {
        beforeEach(() => {
            redis.setup(r => r.get("prettygoat_workflow:transactions:myLog")).returns(() => JSON.stringify(new Date(8000)));
        });
        it("should retrieve the last timestamp", async () => {
            expect(await subject.read()).to.eql(new Date(8000));
        });
    });

    context("when the log must be commited", () => {
        it("should update the last timestamp", async () => {
            await subject.commit(new Date(10000));

            redis.verify(r => r.set("prettygoat_workflow:transactions:myLog", JSON.stringify(new Date(10000))), Times.once());
        });
    });
});
