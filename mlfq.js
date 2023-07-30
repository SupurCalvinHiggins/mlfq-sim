function assert(cond) {
	if (!cond) {
		console.log("Assertion failed");
		console.trace();
		while (1) {}
	}
}


class Job {
	constructor(time, ioProb, ioTime) {
		assert(time > 0);
		assert(ioProb >= 0 && ioProb < 1);
		assert(ioTime >= 0);

		this.time = time;
		this.ioProb = ioProb;
		this.ioTime = ioTime;
		this.runCount = 0;
	}

	run(quant) {
		assert(quant > 0);
		if (Math.random() <= this.ioProb) {
			quant -= Math.min(quant, this.ioTime);
		}
		this.time -= quant;
		this.runCount += 1;
		assert(quant > 0);
		return quant;
	}

	isDone() {
		return this.time <= 0;
	}
}


class MLFQ {
	constructor(quants, runAlloc, stepAlloc) {
		assert(quants.length > 0);
		assert(quants.every((quant) => quant > 0));
		assert(runAlloc > 0);
		assert(stepAlloc > 0);

		this.queues = Array.from(Array(quants.length), () => new Array(0));
		this.quants = quants;
		this.runAlloc = runAlloc
		this.stepAlloc = stepAlloc;
		this.stepCount = 0;
	}

	submitJob(job) {
		assert(job instanceof Job);

		this.queues[0].push(job);
	}

	step() {
		let qIdx = this.queues.findIndex((q) => q.length !== 0)
		if (qIdx === -1) {
			return;
		}
		
		let q = this.queues[qIdx];
		let quant = this.quants[qIdx];

		while (quant > 0) {
			quant -= q[0].run(quant);
			let job = q.shift();
			if (job.isDone()) continue;
			if (job.runCount >= this.runAlloc && qIdx !== this.queues.length - 1) {
				job.runCount = 0;
				this.queues[qIdx+1].push(job);
				continue;
			}
			q.push(job);
		}

		this.stepCount += 1;
		if (this.stepCount >= this.stepAlloc) {
			this.stepCount = 0;
			this.queues[0] = this.queues.flat();
			for (let i = 1; i < this.queues.length; ++i) {
				this.queues[i] = [];
			}
		}
	}
}


function test() {
	console.log("start test");
	
	let mlfq = new MLFQ([50, 100], 3, 10);

	let jobA = new Job(300, 0, 0);
	let jobB = new Job(1000, 0, 0);
	let jobC = new Job(400, 0, 0);

	mlfq.submitJob(jobA);
	mlfq.submitJob(jobB);
	mlfq.submitJob(jobC);

	for (let i = 0; i < 8; ++i) {
		mlfq.step();
	}
	console.log(mlfq);

	for (let i = 0; i < 9; ++i) {
		mlfq.step();
	}
	console.log(mlfq);
}


test();
while (1) {}
