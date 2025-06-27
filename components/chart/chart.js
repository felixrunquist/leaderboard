import dynamic from 'next/dynamic';

// Load chart without SSR
const ReactEChartsCore = dynamic(
  () => import('echarts-for-react'),
  { ssr: false }
);


import React from 'react';
// Import the echarts core module, which provides the necessary interfaces for using echarts.
import * as echarts from 'echarts/core';
// Import charts, all with Chart suffix
import {
  LineChart as EchartLineChart,
  BarChart,
  // PieChart,
  // ScatterChart,
  // RadarChart,
  // MapChart,
  // TreeChart,
  // TreemapChart,
  // GraphChart,
  // GaugeChart,
  // FunnelChart,
  // ParallelChart,
  // SankeyChart,
  // BoxplotChart,
  // CandlestickChart,
  // EffectScatterChart,
  // LinesChart,
  // HeatmapChart,
  // PictorialBarChart,
  // ThemeRiverChart,
  // SunburstChart,
  // CustomChart,
} from 'echarts/charts';
// import components, all suffixed with Component
import {
  // GridSimpleComponent,
  GridComponent,
  // PolarComponent,
  // RadarComponent,
  // GeoComponent,
  // SingleAxisComponent,
  // ParallelComponent,
  // CalendarComponent,
  // GraphicComponent,
  // ToolboxComponent,
  TooltipComponent,
  // AxisPointerComponent,
  // BrushComponent,
  TitleComponent,
  // TimelineComponent,
  // MarkPointComponent,
  // MarkLineComponent,
  // MarkAreaComponent,
  LegendComponent,
  // LegendScrollComponent,
  // LegendPlainComponent,
  DataZoomComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  // VisualMapComponent,
  // VisualMapContinuousComponent,
  // VisualMapPiecewiseComponent,
  // AriaComponent,
  // TransformComponent,
  DatasetComponent,
} from 'echarts/components';
// Import renderer, note that introducing the CanvasRenderer or SVGRenderer is a required step
import {
  CanvasRenderer,
  // SVGRenderer,
} from 'echarts/renderers';

// Register the required components
echarts.use(
  [TitleComponent, TooltipComponent, GridComponent, LegendComponent, EchartLineChart, BarChart, CanvasRenderer, DataZoomComponent, DataZoomInsideComponent, DataZoomSliderComponent,]
);

export default function Chart({options}){
    // The usage of ReactEChartsCore are same with above.
    return <ReactEChartsCore
    echarts={echarts}
    option={options}
    notMerge={true}
    lazyUpdate={true}
    style={{ width: '100%', height: '100%' }}
    // theme={"theme_name"}
    // onChartReady={this.onChartReadyCallback}
    // onEvents={EventsDict}
    // opts={}
    />
}
