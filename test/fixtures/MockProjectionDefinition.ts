import {injectable} from "inversify";
import {IProjection, IProjectionDefinition} from "prettygoat";

@injectable()
class MockProjectionDefinition implements IProjectionDefinition<number> {

    constructor() {

    }

    define(): IProjection<number> {
        return {
            name: "Mock",
            definition: {
                $init: () => 10,
                TestEvent: (s, e: number) => s + e
            },
            publish: {
                "Test": {}
            }
        };
    }

}

export default MockProjectionDefinition
