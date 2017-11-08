class Tick {
    state: string | object;
    clock: Date;

    constructor(clock: Date, state?: string | object) {
        this.clock = clock;
        this.state = state;
    }
}

export default Tick
