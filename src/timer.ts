export default class Timer {
    private startTime = this.time();
    private running = true;
    private stoppedTime = 0;

    private time() {
        return performance.now() / 1000;
    }

    stop() {
        if(!this.running) return;
        this.stoppedTime = this.get();
        this.running = false;
    }

    start() {
        if(this.running) return;
        this.running = true;
        this.set(this.stoppedTime);
    }

    toggle() {
        if(this.running) this.stop();
        else this.start();
    }

    reset() {
        if(!this.running) this.stoppedTime = 0;
        else this.startTime = this.time();
    }

    set(time: number) {
        if(!this.running) this.stoppedTime = time;
        else this.startTime = this.time() - time;
    }

    get() {
        if(!this.running) return this.stoppedTime;
        else return this.time() - this.startTime;
    }
}