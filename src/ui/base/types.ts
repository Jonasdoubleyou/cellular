import { useEffect, useState } from "react";
import { Block, UpdateBlock } from "../../model/block";
import { Runtime } from "../../runtime";
import { RunResult } from "../../runtime/block";



export interface BlockUIProps<It extends Block> {
    block: It;
    updateBlock: UpdateBlock<It>;
    removeBlock: (block: It) => void;
    runtime: Runtime;
}

export function useRunResult(block: Block, runtime: Runtime) {
    const [lastResult, setLastResult] = useState<RunResult | null>(null);

    useEffect(() => runtime.getRuntimeBlock(block.blockID).onRun(setLastResult), []);

    return lastResult;
}