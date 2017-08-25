import {VirtualTimeScheduler} from "rxjs";

class HistoricalScheduler extends VirtualTimeScheduler {

    advanceTo(timestamp: number) {
        while (true) {
            let action = this.actions[0];
            if (!action || (action && action.delay - this.frame > timestamp))
                break;

            action = this.actions.shift();
            action.execute(action.state, action.delay);
            this.frame = action.delay;
        }
    }
}

export default HistoricalScheduler
