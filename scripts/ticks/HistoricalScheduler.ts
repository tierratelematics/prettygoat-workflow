import { VirtualTimeScheduler } from "rxjs";

class HistoricalScheduler extends VirtualTimeScheduler {

    advanceTo(timestamp: number) {
        do {
            const action = this.actions.shift();
            if (!action) {
                break;
            }

            action.execute(action.state, action.delay);
            this.frame = action.delay;
        } while (this.frame < timestamp);
    }
}

export default HistoricalScheduler
