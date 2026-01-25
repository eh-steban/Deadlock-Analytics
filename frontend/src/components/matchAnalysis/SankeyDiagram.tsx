import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

export interface SankeyNode {
  name: string;
  totalDamage?: number;
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

export interface SankeyTooltipParams {
  dataType: 'node' | 'edge';
  name: string;
  data: {
    totalDamage?: number;
    value?: number;
    percentage?: number;
  };
}

export function formatSankeyTooltip(
  params: SankeyTooltipParams
): string | undefined {
  if (params.dataType === 'edge') {
    const percentage =
      params.data.percentage ? ` (${params.data.percentage.toFixed(1)}%)` : '';
    return `Damage: ${params.data.value?.toLocaleString()}${percentage}`;
  }
  if (params.dataType === 'node') {
    const totalDamage = params.data.totalDamage;
    if (totalDamage !== undefined) {
      return `${params.name}: ${totalDamage.toLocaleString()} damage`;
    }
    return params.name;
  }
  return undefined;
}

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({ nodes, links }) => {
  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: formatSankeyTooltip,
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
              const percentage =
                params.data.percentage ?
                  ` (${params.data.percentage.toFixed(1)}%)`
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
