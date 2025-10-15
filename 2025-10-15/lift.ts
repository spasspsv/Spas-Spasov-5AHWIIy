export type Direction = 'up' | 'down' | 'idle';

export default class Elevator {
    readonly totalFloors: number;
    currentFloor: number;
    direction: Direction = 'idle';
    doorsOpen: boolean = false;

    private internalRequests = new Set<number>(); 
    private externalCalls = new Map<number, Set<Direction>>(); 

    constructor(totalFloors: number, startFloor = 1) {
        if (totalFloors < 1) throw new Error('totalFloors must be >= 1');
        if (startFloor < 1 || startFloor > totalFloors) throw new Error('startFloor out of range');
        this.totalFloors = totalFloors;
        this.currentFloor = startFloor;
    }

    pressButton(floor: number) {
        this.validateFloor(floor);
        this.internalRequests.add(floor);
    }

    call(floor: number, dir: Exclude<Direction, 'idle'>) {
        this.validateFloor(floor);
        const set = this.externalCalls.get(floor) ?? new Set<Direction>();
        set.add(dir);
        this.externalCalls.set(floor, set);
    }

    step() {
        if (this.doorsOpen) {
            this.closeDoors();
            return;
        }

        if (this.shouldStopAtFloor(this.currentFloor, this.direction)) {
            this.openDoors();
            return;
        }

        const dir = this.determineDirection();
        this.direction = dir;
        if (dir === 'idle') return;

        this.moveOneFloor(dir);
    }

    openDoors() {
        this.doorsOpen = true;

        if (this.internalRequests.has(this.currentFloor)) {
            this.internalRequests.delete(this.currentFloor);
        }

        const calls = this.externalCalls.get(this.currentFloor);
        if (calls) {
            if (this.direction === 'idle') {
                this.externalCalls.delete(this.currentFloor);
            } else {
                calls.delete(this.direction);
                if (calls.size === 0) this.externalCalls.delete(this.currentFloor);
                else this.externalCalls.set(this.currentFloor, calls);
            }
        }
    }

    closeDoors() {
        setTimeout(() => {
            this.doorsOpen = false;
            if (!this.hasRequestsAbove(this.currentFloor) && !this.hasRequestsBelow(this.currentFloor)) {
                this.direction = 'idle';
            }
        }, 1000);
        return;
        this.doorsOpen = false;
        if (!this.hasRequestsAbove(this.currentFloor) && !this.hasRequestsBelow(this.currentFloor)) {
            this.direction = 'idle';
        }
    }

    private moveOneFloor(dir: Exclude<Direction, 'idle'>) {
        const waitThreeSeconds = () => new Promise<void>(resolve => setTimeout(resolve, 3000));
        void waitThreeSeconds();
        if (this.doorsOpen) return;
        if (dir === 'up') {
            if (this.currentFloor < this.totalFloors) this.currentFloor += 1;
            else this.direction = 'idle';
        } else {
            if (this.currentFloor > 1) this.currentFloor -= 1;
            else this.direction = 'idle';
        }
    }

    private determineDirection(): Direction {
        if (this.direction === 'up') {
            if (this.hasRequestsAbove(this.currentFloor)) return 'up';
            if (this.hasRequestsBelow(this.currentFloor)) return 'down';
            return 'idle';
        }

        if (this.direction === 'down') {
            if (this.hasRequestsBelow(this.currentFloor)) return 'down';
            if (this.hasRequestsAbove(this.currentFloor)) return 'up';
            return 'idle';
        }

        const nearest = this.findNearestRequest();
        if (nearest === null) return 'idle';
        return nearest > this.currentFloor ? 'up' : (nearest < this.currentFloor ? 'down' : 'idle');
    }
    
        private shouldStopAtFloor(floor: number, dir: Direction): boolean {
            if (this.internalRequests.has(floor)) return true;
            const calls = this.externalCalls.get(floor);
            if (!calls) return false;
            if (dir === 'idle') return calls.size > 0;
            return calls.has(dir);
        }
    
        private hasRequestsAbove(fromFloor: number): boolean {
            for (const f of this.internalRequests) if (f > fromFloor) return true;
            for (const f of this.externalCalls.keys()) if (f > fromFloor) return true;
            return false;
        }
    
        private hasRequestsBelow(fromFloor: number): boolean {
            for (const f of this.internalRequests) if (f < fromFloor) return true;
            for (const f of this.externalCalls.keys()) if (f < fromFloor) return true;
            return false;
        }
    
        private findNearestRequest(): number | null {
            let best: number | null = null;
            const consider = (f: number) => {
                if (best === null || Math.abs(f - this.currentFloor) < Math.abs(best - this.currentFloor)) best = f;
            };
            for (const f of this.internalRequests) consider(f);
            for (const f of this.externalCalls.keys()) consider(f);
            return best;
        }
    
        private validateFloor(floor: number) {
            if (!Number.isInteger(floor) || floor < 1 || floor > this.totalFloors) {
                throw new Error('floor out of range');
            }
        }
    
        get pendingInternalRequests(): number[] {
            return Array.from(this.internalRequests).sort((a, b) => a - b);
        }
        get pendingExternalCalls(): { floor: number; directions: Direction[] }[] {
            return Array.from(this.externalCalls.entries()).map(([floor, s]) => ({
                floor,
                directions: Array.from(s),
            }));
        }
    }