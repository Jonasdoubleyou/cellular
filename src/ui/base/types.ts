import { useEffect, useMemo, useState } from "react";
import { Block, BlockID } from "../../model/block";
import { Runtime } from "../../runtime";
import { RunResult } from "../../runtime/block";
import { VariableRecord } from "../../model/variables";



export interface BlockUIProps {
    blockID: BlockID;
    runtime: Runtime;
}

export function useRunResult(blockID: BlockID, runtime: Runtime) {
    const [lastResult, setLastResult] = useState<RunResult | null>(null);

    useEffect(() => runtime.getRuntimeBlock(blockID).onRun(setLastResult), []);

    return lastResult;
}

export function useRuntimeBlock(blockID: BlockID, runtime: Runtime) {
    return useMemo(() => runtime.getRuntimeBlock(blockID), [blockID, runtime]);
}

export function useInput(blockID: BlockID, runtime: Runtime) {
    const [input, setInput] = useState<VariableRecord | null>(null);
    const rb = useRuntimeBlock(blockID, runtime);

    useEffect(() => {
        rb.getInput().then(setInput);
        return rb.onInputChange(setInput);
    }, [runtime, blockID]);

    return input;
}