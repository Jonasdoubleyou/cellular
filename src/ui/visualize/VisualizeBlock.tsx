import { useEffect, useMemo, useState } from "react";
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
import { TableUI } from "./Table";

import "./VisualizeBlock.css"
import { Column, ExpressionColumn } from "../../library/table/Column";
import { BoxplotUI } from "./Boxplot";
import { HistogrammUI } from "./Histogramm";

// Maps Block graphtypes to React implementations
const visualForType: { [type in VisualizeBlock["graphtype"]]: React.FC<BlockUIProps> } = {
    boxplot: WithNumericColumn(BoxplotUI),
    histogram: WithColumn(({ column: x, ...props }) => WithNumericColumn(({ column: y }) => HistogrammUI({ x, y}))(props)),
    number: WithNumber(NumberUI),
    table: WithTable(TableUI),
    json: WithAny(JsonUI)
};

// Restricts selectable inputs for graphtypes
const possibleTypes: { [type in VisualizeBlock["graphtype"]]: Type } = {
    number: { base: "number" },
    table: { base: "object", name: "Table" },
    json: { base: "any" },
    boxplot: { base: "object", name: "Table" },
    histogram: { base: "object", name: "Table" }
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

// ---------- Data Accessors -------------------
// Convenience wrappers to render components with specific inputs
// and gracefully render nothing otherwise

type Component<Props> = (props: (Props & BlockUIProps)) => React.ReactElement | null;

function WithNumber<Props extends { value: number }>(Component: Component<Props>) {
    return function Wrapped(props: BlockUIProps & Omit<Props, "value">) {    
        const input = useInput(props.blockID, props.runtime);
        const value = useMemo(() => input ? getNumber(input) : null, [input]);

        return <Component value={value as number} {...props as any} />;
    }
}

function getNumber(input: VariableRecord) {
    const keys = Object.keys(input);
    if (keys.length !== 1) return null;

    const value = input[ keys[0] ];
    if(typeof value !== "number") return null;

    return (value as number);
}

function WithAny<Props extends { value: any }>(Component: Component<Props>) {
    return function Wrapped(props: Omit<Props, 'value'> & BlockUIProps) {
        const input = useInput(props.blockID, props.runtime);
        const value = useMemo(() => input ? getAny(input) : null, [input]);
        return <Component value={value} {...props as any} />
    }
}

function getAny(input: VariableRecord) {
    const keys = Object.keys(input);
    if (keys.length !== 1) return null;

    const value = input[ keys[0] ];
    return value;
}

function WithTable<Props extends { table: Table<any> }>(Component: Component<Props>) {
    return function Wrapped(props: Omit<Props, 'table'> & BlockUIProps) {
        const input = useInput(props.blockID, props.runtime);
        const value = useMemo(() => input ? getAny(input) : null, [input]);
    
        if (!value) return null;
        if (!(value instanceof Table)) return null;

        return <Component table={value as Table<any>} {...props as any} />;
    }
}

function WithColumn<Props extends { column: Column<any> }>(Component: Component<Props>) {
    return function Wrapped(props: Omit<Props, 'column'> & BlockUIProps) {
    
        const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
        const input = useInput(props.blockID, props.runtime);
        const table = useMemo(() => input ? getAny(input) : null, [input]);
        const column = useMemo(() => {
            if (!table || !selectedColumn) return null;
            if (!(table instanceof Table)) return null;
    
            let col = table.col(selectedColumn);

            return col;
        }, [table, selectedColumn]);

        if (!table || !(table instanceof Table)) return <>Missing table input</>;
    
        return <div>
            {table && <Select options={table.cols().map(it => it.name)} onChange={setSelectedColumn} />}
            {column && <Component column={column} {...props as any} />}
        </div>;
    }
}

function WithNumericColumn<Props extends { column: Column<number> }>(Component: Component<Props>) {
    return function Wrapped(props: Omit<Props, 'column'> & BlockUIProps) {
    
        const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
        const input = useInput(props.blockID, props.runtime);
        const table = useMemo(() => input ? getAny(input) : null, [input]);
        const column = useMemo(() => {
            if (!table || !selectedColumn) return null;
            if (!(table instanceof Table)) return null;
    
            let col = table.col(selectedColumn);
            if (col.type.base !== "number") {
                col = new ExpressionColumn(col, "parseFloat", { base: "number" }, (value) => parseFloat(value));
            }

            return col;
        }, [table, selectedColumn]);

        if (!table || !(table instanceof Table)) return <>Missing table input</>;
    
        return <div>
            {table && <Select options={table.cols().map(it => it.name)} onChange={setSelectedColumn} />}
            {column && <Component column={column} {...props as any} />}
        </div>;
    }
}

// ---------- Trivial visualizations ----------

function NumberUI({ value }: { value: number }) {
    return <div className="visualize-number">
        <div className="visualize-number-value">
            {value ?? "?"}
        </div>
    </div>;
}

function JsonUI({ value }: { value: any }) {
    return <ReactJson src={value} collapsed={2}  />;
}
