import { performance } from 'perf_hooks';

// Simulate DB responses
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 5)); // 5ms per DB operation

async function oldWay(usages: any[]) {
    const start = performance.now();
    for (const usage of usages ?? []) {
        await simulateDelay(); // select single
        await simulateDelay(); // update single
        await simulateDelay(); // delete single
    }
    const end = performance.now();
    return end - start;
}

async function newWay(usages: any[]) {
    const start = performance.now();
    if (usages && usages.length > 0) {
        // Find unique gift card IDs and sum their usages to handle multiple usages per card
        const cardUsages: Record<string, number> = {};
        const usageIds: string[] = [];

        for (const usage of usages) {
            usageIds.push(usage.id);
            cardUsages[usage.gift_card_id] = (cardUsages[usage.gift_card_id] || 0) + Number(usage.amount_used);
        }

        const cardIds = Object.keys(cardUsages);

        await simulateDelay(); // select in

        // update multiple
        await Promise.all(cardIds.map(() => simulateDelay()));

        await simulateDelay(); // delete in
    }
    const end = performance.now();
    return end - start;
}

async function run() {
    const usages = Array.from({length: 10}, (_, i) => ({ id: i.toString(), gift_card_id: i.toString(), amount_used: 10 }));
    console.log(`Benchmarking with ${usages.length} gift card usages`);

    const baseTime = await oldWay(usages);
    console.log(`Baseline (N+1) time: ${baseTime.toFixed(2)}ms`);

    const optTime = await newWay(usages);
    console.log(`Optimized (Batch) time: ${optTime.toFixed(2)}ms`);

    console.log(`Improvement: ${((baseTime - optTime) / baseTime * 100).toFixed(2)}% faster`);
}

run();
