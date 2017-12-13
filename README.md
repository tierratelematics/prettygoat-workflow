# Prettygoat-workflow

Manage workflows and process side effects safely with [prettygoat](https://github.com/tierratelematics/prettygoat).

## Installation

`
$ npm install prettygoat-workflow
`

Add this code to the boostrapper.

Register also an implementation of an [ITranslationLog](https://github.com/tierratelematics/prettygoat-workflow/blob/master/scripts/workflow/TransactionLog.ts) to save the current timestamp.

```typescript
import {WorkflowModule} from "prettygoat-workflow";

engine.register(new WorkflowModule());
```

## Usage

Register a workflow processor in a module.

```typescript
import {IWorkflowProcessorFactory, IWorkflowProcessor} from "prettygoat-workflow";

container.bind<IWorkflowProcessor>("IWorkflowProcessor").toDynamicValue(() => {
    let factory = container.get<IWorkflowProcessorFactory>("IWorkflowProcessorFactory");
    return factory.processorFor("myWorkflow");
}).whenInjectedInto(MyWorkflow);
```

And use it in a workflow.

```typescript
import {IWorkflow, IWorkflowDefinition, IWorkflowProcessor} from "prettygoat-workflow";
import {inject} from "inversify";

class MyWorkflow implements IWorkflowDefinition<void> {

    constructor(@inject("IWorkflowProcessor") private workflowProcessor: IWorkflowProcessor) {

    }

    define(): IWorkflow<void> {
        return {
            name: "Workflow",
            definition: {
                "InvitationSent": async (state, payload, event) => {
                    await this.workflowProcessor.process(() => {
                        // Send email
                    }, event.timestamp);
                    return state;
                }
            }
        };
    }
}
```

## License

Copyright 2016 Tierra SpA

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
