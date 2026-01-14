import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

// TODO: Add imgs
export interface SankeyNode {
  name: string;
  itemStyle?: {
    color?: string;
  };
  label?: {
    formatter?: string | ((params: any) => string);
    rich?: Record<string, any>;
  };
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  percentage?: number;
}

interface SankeyDiagramProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  nodes,
  links,
}) => {
  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: (params: any) => {
        if (params.dataType === 'edge') {
          const percentage = params.data.percentage
            ? ` (${params.data.percentage.toFixed(1)}%)`
            : '';
          return `Damage: ${params.data.value.toLocaleString()}${percentage}`;
        }
      },
    },
    series: [
      {
        type: 'sankey',
        layout: 'none',
        emphasis: {
          focus: 'adjacency',
        },
        data: nodes,
        links: links.map((link) => ({
          ...link,
          label: {
            show: true,
            position: 'right',
            formatter: (params: any) => {
              const percentage = params.data.percentage
                ? ` (${params.data.percentage.toFixed(1)}%)`
                : '';
              return `${params.data.value.toLocaleString()}${percentage}`;
            },
            fontSize: 11,
            color: '#333',
          },
        })),
        lineStyle: {
          color: 'gradient',
          curveness: 0.5,
        },
        label: {
          fontSize: 13,
          fontWeight: 'bold',
          position: 'right',
          distance: 8,
        },
        nodeWidth: 20,
        nodeGap: 12,
        layoutIterations: 0,
      },
    ],
  };

  return (
    <ReactECharts
      echarts={echarts}
      option={option}
      style={{ height: '600px', width: '90%' }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

export default SankeyDiagram;
