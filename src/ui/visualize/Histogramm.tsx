import { Column } from "../../library/table/Column";
import { curveLinear } from '@visx/curve';
import { LinePath } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { MarkerArrow, MarkerCross, MarkerX, MarkerCircle, MarkerLine } from '@visx/marker';
import { useMemo } from "react";

export function HistogrammUI({ x, y }: { x: Column<any>, y: Column<number> }) {
    const width = 800;
    const height = 500;

    function getOffset(value: any, index: number) {
        if (typeof value === "number") return value;
        return index;
    }

    const { points, minY, maxY } = useMemo(() => {
        const xArr = x.toArray();
        // TODO: Groupby X
        const points = xArr.map((x, i) => ({ x, i, y: y.get(i), offset: getOffset(x, i) }));
        points.sort((a, b) => a.offset - b.offset);

        let minY = Infinity;
        let maxY = -Infinity;
        for (const point of points) {
            if (point.y < minY) minY = point.y;
            if (point.y > maxY) maxY = point.y;
        }

        return { points, minY, maxY };
    }, [x]);
    
    
    const xScale = scaleLinear<number>({
        range: [width - 10, 10],
        round: true,
        domain: [points[0]?.offset ?? 0, points[points.length -1]?.offset ?? 0],
      });

    const yScale = scaleLinear<number>({
        range: [height - 30, 30],
        round: true,
        domain: [minY, maxY],
    });

    return <div>
        <svg width={width} height={height}>
        <linearGradient id="statsplot" to="#0F2027" from="#2c5364" />
        <rect width={width} height={height} fill="url(#statsplot)" rx={14} ry={14} />
        {
            points.map(point => <circle
                    key={point.i}
                    r={3}
                    cx={xScale(point.offset)}
                    cy={yScale(point.y)}
                    stroke="white"
                    fill="transparent"
            />)}
            <LinePath
                  curve={curveLinear}
                  data={points}
                  x={point => xScale(point.offset)}
                  y={point => yScale(point.y)}
                  stroke="white"
                  strokeWidth={1}
                  strokeOpacity={1}
                  shapeRendering="geometricPrecision"
            />
      </svg>
    </div>
}