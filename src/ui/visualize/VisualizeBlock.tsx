import { useMemo } from "react";
import { VisualizeBlock } from "../../model/block";
import { BlockUI } from "../base/Block";
import { ButtonList } from "../base/Button";
import { Editable } from "../base/Editable";
import { IconButton } from "../base/Icons";
import { useBlock } from "../base/store";
import { BlockUIProps, useInput, useRuntimeBlock } from "../base/types";
import { Select } from "../base/Select";
import { VariableRecord, detectType } from "../../model/variables";
import "./VisualizeBlock.css"

const visualForType: { [type in VisualizeBlock["graphtype"]]: React.FC<BlockUIProps> } = {
    boxplot: () => <>TODO</>,
    histogram: () => <>TODO</>,
    number: VisualizeNumber,
    table: () => <>TODO</>
};

export function VisualizeBlockUI({ blockID, runtime }: BlockUIProps) {
    const graphtype = useMemo(() => runtime.getBlock<VisualizeBlock>(blockID).graphtype, [blockID, runtime]);
    const Visual = visualForType[graphtype];

    return <BlockUI>
        <BlockUI.Header>
            <BlockUI.Title title={<VisualizeBlockTitle blockID={blockID} runtime={runtime} />} />
            <ButtonList right>
                <IconButton small icon="cancel" onClick={() => runtime.removeBlock(runtime.getBlock(blockID))} />
            </ButtonList>
        </BlockUI.Header>
        
        <Visual blockID={blockID} runtime={runtime} />
    </BlockUI>;
}


function VisualizeBlockTitle({ blockID, runtime }: BlockUIProps) {
    const block = useBlock<VisualizeBlock>(runtime.getStore(), blockID);

    return <Editable text={block.name} onFinish={title => runtime.updateBlock(block, { title })} />
}

function VisualizeNumber({ blockID, runtime }: BlockUIProps) {
    const block = useBlock<VisualizeBlock>(runtime.getStore(), blockID);
    const rb = useRuntimeBlock(blockID, runtime);

    // TODO: Properly cache & refresh
    const potentialInputs = rb.getPotentialInputs({ base: "number" });
    
    const input = useInput(blockID, runtime);
    const value = useMemo(() => input ? getNumber(input) : null, [input]);

    return <div className="visualize-number">
        <div className="visualize-number-value">
            {value ?? "?"}
        </div>
        <Select options={potentialInputs} map={it => it.variable.name} onChange={({ blockID, variable }) => { console.log("onChange"); rb.setInput([{ blockID, variables: [variable.name]}])}} />
    </div>;
}

function getNumber(input: VariableRecord) {
    const keys = Object.keys(input);
    if (keys.length !== 1) return null;

    const value = input[ keys[0] ];
    if(detectType(value).base !== "number") return null;

    return (value as number).toFixed(2);
}