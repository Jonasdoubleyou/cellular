import { useEffect, useMemo } from "react";
import { VisualizeBlock } from "../../model/block";
import { BlockUI } from "../base/Block";
import { ButtonList } from "../base/Button";
import { Editable } from "../base/Editable";
import { IconButton } from "../base/Icons";
import { useBlock } from "../base/store";
import { BlockUIProps, useInput, useRuntimeBlock } from "../base/types";
import { Select } from "../base/Select";
import { Type, VariableRecord, detectType } from "../../model/variables";
import ReactJson from '@microlink/react-json-view'

import "./VisualizeBlock.css"

const visualForType: { [type in VisualizeBlock["graphtype"]]: React.FC<BlockUIProps> } = {
    boxplot: () => <>TODO</>,
    histogram: () => <>TODO</>,
    number: VisualizeNumber,
    table: () => <>TODO</>,
    json: VisualizeJson
};

const possibleTypes: { [type in VisualizeBlock["graphtype"]]?: Type } = {
    number: { base: "number" }
};

export function VisualizeBlockUI({ blockID, runtime }: BlockUIProps) {
    const graphtype = useMemo(() => runtime.getBlock<VisualizeBlock>(blockID).graphtype, [blockID, runtime]);
    const Visual = visualForType[graphtype];

    // TODO: Properly cache & refresh
    const rb = useRuntimeBlock(blockID, runtime);
    const potentialInputs = rb.getPotentialInputs(possibleTypes[graphtype]);
    const input = useInput(blockID, runtime);
    
    // Auto select if only one viable input available
    useEffect(() => {
        if ((!input || Object.values(input).length === 0) && potentialInputs && potentialInputs.length === 1) {
            rb.setInput([{ blockID: potentialInputs[0].blockID, variables: [potentialInputs[0].variable.name] }]);
        }
    }, [input, potentialInputs])
    
    const hasInput = input && Object.keys(input).length > 0;
    return <BlockUI>
        <BlockUI.Header>
            <BlockUI.Title title={<VisualizeBlockTitle blockID={blockID} runtime={runtime} />} />
            <ButtonList right>
                <IconButton small icon="cancel" onClick={() => runtime.removeBlock(runtime.getBlock(blockID))} />
            </ButtonList>
        </BlockUI.Header>
        <Select options={potentialInputs} map={it => it.variable.name} onChange={({ blockID, variable }) => { console.log("onChange"); rb.setInput([{ blockID, variables: [variable.name]}])}} />
        {!hasInput && <>Choose an input</>}
        {hasInput && <Visual blockID={blockID} runtime={runtime} />}
    </BlockUI>;
}


function VisualizeBlockTitle({ blockID, runtime }: BlockUIProps) {
    const block = useBlock<VisualizeBlock>(runtime.getStore(), blockID);

    return <Editable text={block.name} onFinish={title => runtime.updateBlock(block, { title })} />
}

function VisualizeNumber({ blockID, runtime }: BlockUIProps) {    
    const input = useInput(blockID, runtime);
    const value = useMemo(() => input ? getNumber(input) : null, [input]);

    return <div className="visualize-number">
        <div className="visualize-number-value">
            {value ?? "?"}
        </div>
    </div>;
}

function getNumber(input: VariableRecord) {
    const keys = Object.keys(input);
    if (keys.length !== 1) return null;

    const value = input[ keys[0] ];
    if(detectType(value).base !== "number") return null;

    return (value as number).toFixed(2);
}

function VisualizeJson({ blockID, runtime }: BlockUIProps) {
    const input = useInput(blockID, runtime);
    const value = useMemo(() => input ? getAny(input) : null, [input]);
    console.log("VisualizeJson", value);
    return <ReactJson src={value} collapsed={2}  />;
}

function getAny(input: VariableRecord) {
    const keys = Object.keys(input);
    if (keys.length !== 1) return null;

    const value = input[ keys[0] ];
    return value;
}