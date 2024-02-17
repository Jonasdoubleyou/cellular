import { scaleLinear } from "@visx/scale";
import { Column } from "../../library/table/Column";
import { BoxPlot } from "@visx/stats";
import { LinearGradient } from '@visx/gradient';
import { Text } from '@visx/text';
import { useMemo } from "react";

export function BoxplotUI({ column }: { column: Column<number> }) {
    const values = useMemo(() => column.sorted().toArray(), [column]);
    if (values.length < 1) {
        return null;
    }

    const minYValue = values[0];
    const maxYValue = values[values.length - 1];
    // TODO: Check that rounding is correct
    const median = values[Math.floor(values.length * 1/2)];
    const firstQuartile = values[Math.floor(values.length * 1/4)];
    const thirdQuartile = values[Math.floor(values.length * 3/4)];

    const width = 150;
    const height = 400;

    const yScale = scaleLinear<number>({
        range: [400 - 20, 20],
        round: true,
        domain: [minYValue, maxYValue],
      });

    return <div>
        <svg width={width} height={height}>
            <LinearGradient id="statsplot" to="#0F2027" from="#2c5364" />
            <rect x={0} y={0} width={width} height={height} fill="url(#statsplot)" rx={14} />
            
            <BoxPlot 
                  left={45}
                  min={minYValue}
                  max={maxYValue}
                  median={median}
                  firstQuartile={firstQuartile}
                  thirdQuartile={thirdQuartile}
                  valueScale={yScale} fill="white"
                  fillOpacity={0.3}
                  stroke="white"
                  strokeWidth={3} /> 
        <text x={75} y={25} fontSize={10} fill="white" textAnchor="start">
            {maxYValue}
        </text>
        <text x={75} y={yScale(thirdQuartile) + 5} fontSize={10}  fill="white" textAnchor="start">
            {thirdQuartile}
        </text>
        <text x={75} y={yScale(median) + 5} fontSize={10} fontWeight="bold" fill="white" textAnchor="start">
            {median}
        </text>
        <text x={75} y={yScale(firstQuartile) + 5} fontSize={10}  fill="white" textAnchor="start">
            {firstQuartile}
        </text>
        <text x={75} y={400 - 15} fontSize={10} fill="white" textAnchor="start">
            {minYValue}
        </text>
        </svg>
    </div>
}