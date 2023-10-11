import { isArray } from '@visactor/vutils';
import type { PivotChart } from '../../PivotChart';
import { PivotLayoutMap } from '../../layout/pivot-layout';
import type { IPivotTableCellHeaderPaths, PivotChartConstructorOptions } from '../../ts-types';
import { createDataset } from './create-dataset';

export function getDataCellPath(
  options: PivotChartConstructorOptions,
  data: Object,
  compareFunc?: (a: any, b: any) => boolean
): IPivotTableCellHeaderPaths | undefined {
  // mock dataset
  const dataset = createDataset(options);

  // mock pivotChart
  const mockTable = {
    options,
    isPivotChart: () => true,
    pivotChartAxes: [] as any[],
    _selectedDataItemsInChart: [] as any[],
    _getActiveChartInstance: () => {
      return {
        updateState: () => {
          // do nothing
        }
      };
    }
  };

  // mock layoutMap
  const layoutMap = new PivotLayoutMap(mockTable as PivotChart, dataset);

  // compare data
  for (let col = 0; col < layoutMap.colCount; col++) {
    for (let row = 0; row < layoutMap.rowCount; row++) {
      if (layoutMap.isHeader(col, row)) {
        continue;
      }
      const colKey = dataset.colKeysPath[layoutMap.getRecordIndexByCol(col)] ?? [];
      const rowKey = dataset.rowKeysPath[layoutMap.getRecordIndexByRow(row)] ?? [];
      const aggregator = dataset.getAggregator(
        rowKey[rowKey.length - 1],
        colKey[colKey.length - 1],
        (layoutMap as PivotLayoutMap).getIndicatorKey(col, row)
      );
      const result = compareData(
        aggregator.value ? aggregator.value() : undefined,
        data,
        col,
        row,
        layoutMap,
        compareFunc
      );
      if (result) {
        return result;
      }
    }
  }
  return undefined;
}

function compareData(
  data1: Object[],
  data2: Object,
  col: number,
  row: number,
  layoutMap: PivotLayoutMap,
  compareFunc?: (a: any, b: any) => boolean
) {
  if (isArray(data1)) {
    for (let i = 0; i < data1.length; i++) {
      if (compareFunc ? compareFunc(data1[i], data2) : defaultCompare(data1[i], data2)) {
        return layoutMap.getCellHeaderPaths(col, row);
      }
    }
  }
  return undefined;
}

function defaultCompare(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
}