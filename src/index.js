/* eslint-disable max-lines */
// Distributed using MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.//
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import paint from './paint';
import './styles.less';
import { setValue } from 'qlik-chart-modules';

if (!window._babelPolyfill) { //eslint-disable-line no-underscore-dangle
  require('@babel/polyfill');
}

/* eslint-disable max-len */
const COLOR_SCALES = Object.freeze({
  SEQUENTIAL: Object.freeze(["#FEE391", "#FEC44F", "#FE9929", "#EC7014", "#CC4C02", "#993404", "#662506"]),
  SEQUENTIAL_REVERSE: Object.freeze(["#662506", "#993404", "#CC4C02", "#EC7014", "#FE9929", "#FEC44F", "#FEE391"]),
  DIVERGING_RDYLBU: Object.freeze(["#D73027", "#F46D43", "#FEE090", "#ABD9E9", "#74ADD1", "#4575B4"]),
  DIVERGING_BUYLRD: Object.freeze(["#D73027", "#FDAE61", "#ABD9E9", "#4575B4"]),
  BLUES: Object.freeze(["#DEEBf7", "#C6DBEF", "#9ECAE1", "#6BAED6", "#4292C6", "#2171B5", "#08519C", "#08306B"]),
  REDS: Object.freeze(["#FEE0D2", "#FCBBa1", "#FC9272", "#FB6A4A", "#EF3B2C", "#CB181D", "#A50F15", "#67000D"]),
  YLGNBU: Object.freeze(["#EDF8B1", "#C7E9B4", "#7FCDBB", "#41B6C4", "#1D91C0", "#225EA8", "#253494", "#081D58"]),
  TWELVE_COLORS: Object.freeze(["#332288", "#6699CC", "#88CCEE", "#44AA99", "#117733", "#999933", "#DDCC77", "#661100", "#CC6677", "#AA4466", "#882255", "#AA4499"]),
  TWELVE_COLORS_REVERSE: Object.freeze(["#332288", "#6699CC", "#88CCEE", "#44AA99", "#117733", "#999933", "#DDCC77", "#661100", "#CC6677", "#AA4466", "#882255", "#AA4499"].reverse()),
  BLUE_PURPLE: Object.freeze(["#1ABC9C", "#7F8C8D", "#2ECC71", "#BDC3C7", "#3498DB", "#C0392B", "#9B59B6", "#D35400", "#34495E", "#F39C12", "#16A085", "#95A5A6"]),
  BREEZE: Object.freeze(["#138185", "#26A0A7", "#65D3DA", "#79D69F", "#70BA6E", "#CBE989", "#EBF898", "#F9EC86", "#FAD144", "#EC983D", "#D76C6C", "#A54343"])
});
/* eslint-enable max-len */

function setDimensionLimit(handler) {
  var dims = handler.getDimensions();
  if (dims && dims.length) {
    dims.forEach(function(d, i) {
      if (i === 1) {
        d.qOtherTotalSpec.qOtherMode = 'OTHER_COUNTED';
        d.qOtherTotalSpec.qOtherCounted = { qv: '20' };
      } else {
        delete d.qOtherTotalSpec;
      }
    });
  }
}

function setInitialSort(props) {
  if (!props.qHyperCubeDef) {
    return;
  }
  const dims = props.qHyperCubeDef.qDimensions;
  const measures = props.qHyperCubeDef.qMeasures;
  if (dims.length === 2 && measures.length === 1) {
    props.qHyperCubeDef.qInterColumnSortOrder = [0, 1, 2];
  }
}

const numberFormattingItems = {
  numberFormattingMode: {
    show: false
  },
  numberFormattingType: {
    type: "items", // prevent console warning about missing type
    options: function() {
      return [
        {
          value: "U",
          translation: "Common.Auto"
        },
        {
          value: "F",
          translation: "properties.numberFormatting.types.number"
        },
      ];
    }
  }
};

const numberFormatting = {
  type: "items",
  items: {
    numberFormat: {
      type: "items",
      items: numberFormattingItems
    }
  },
};

// Support without flag MASTER_MEASURE_FORMAT (remove line below when flag becomes permanent)
Object.assign(numberFormatting.items, Object.assign({}, numberFormattingItems));

export default {
  initialProperties: {
    qHyperCubeDef: {
      qDimensions: [],
      qMeasures: [],
      qInitialDataFetch: [{
        qWidth: 3,
        qHeight: 3333
      }]
    }
  },
  data: {
    dimensions: {
      min: 2,
      max: 2,
      add(dimension, props, handler) {
        setDimensionLimit(handler);
        setInitialSort(props);
      },
      remove(dimension, props, handler) {
        setDimensionLimit(handler);
      },
      move(dimension, props, handler) {
        setDimensionLimit(handler);
        setInitialSort(props);
      },
      replace(dimension, old, index, props, handler) {
        setDimensionLimit(handler);
        setInitialSort(props);
      }
    },
    measures: {
      min: 1,
      max: 1
    },
  },
  support: {
    snapshot: true,
    export: true,
    exportData: true
  },
  definition: {
    type: "items",
    component: "accordion",
    items: {
      data: {
        uses: "data",
        items: {
          dimensions: {
            disabledRef: ""
          },
          measures: {
            disabledRef: "",
            items: {
              numberFormatting: numberFormatting
            }
          }
        }
      },
      settings: {
        uses: "settings",
        items: {
          design: {
            label: "Design",
            type: "items",
            items: {
              Line: {
                ref: "strokeStyle",
                component: "dropdown",
                type: "boolean",
                label: "Stroke type",
                defaultValue: true,
                options: [{
                  value: true,
                  label: "Smooth"
                }, {
                  value: false,
                  label: "Straight"
                }],
                show: true
              },
              Range: {
                ref: "range",
                component: "switch",
                type: "boolean",
                translation: "Range",
                defaultValue: true,
                trueOption: {
                  value: true,
                  translation: "Auto"
                },
                falseOption: {
                  value: false,
                  translation: "Custom"
                },
                show: true
              },
              MaxValue: {
                ref: "maxValue",
                type: "number",
                expression: "optional",
                defaultValue: 1,
                show: function(data) {
                  return data.range === false;
                }
              },
              MinValue: {
                ref: "minValue",
                type: "number",
                expression: "optional",
                defaultValue: 0,
                show: function(data) {
                  return data.range === false;
                }
              },
              Legend: {
                ref: "showLegend",
                component: "switch",
                type: "boolean",
                translation: "Legend",
                defaultValue: true,
                trueOption: {
                  value: true,
                  translation: "properties.on"
                },
                falseOption: {
                  value: false,
                  translation: "properties.off"
                },
                show: true
              },
              ColorByDimension: {
                ref: "colorByDimension",
                component: "switch",
                type: "boolean",
                translation: "Color by dimension",
                defaultValue: false,
                trueOption: {
                  value: true,
                  translation: "properties.on",
                },
                falseOption: {
                  value: false,
                  translation: "properties.off",
                },
                show: true,
                change: (data) => {
                  if (data.colorByDimension) {
                    setValue(data, 'color.mode', 'byDimension');
                    setValue(data, 'color.byDimDef.activeDimensionIndex', 0);
                  }
                },
              },
              PersistentColors: {
                ref: "persistentColors",
                component: "checkbox",
                type: "boolean",
                translation: "Persistent colors",
                defaultValue: false,
                trueOption: {
                  value: true,
                  translation: "properties.on",
                },
                falseOption: {
                  value: false,
                  translation: "properties.off",
                },
                show: (data) => data.colorByDimension
              },
              colors: {
                ref: "ColorSchema",
                type: "string",
                component: "item-selection-list",
                label: "Color",
                show: (data) => !data.colorByDimension,
                defaultValue: COLOR_SCALES.TWELVE_COLORS,
                items: [
                  /*{
                    component: "color-scale",
                    colors: COLOR_SCALES.SEQUENTIAL,
                    value: COLOR_SCALES.SEQUENTIAL,
                    label: "Sequential"
                  }, {
                    component: "color-scale",
                    colors: COLOR_SCALES.SEQUENTIAL_REVERSE,
                    value: COLOR_SCALES.SEQUENTIAL_REVERSE,
                    label: "Sequential (Reverse)"
                  }, {
                    component: "color-scale",
                    colors: COLOR_SCALES.DIVERGING_RDYLBU,
                    value: COLOR_SCALES.DIVERGING_RDYLBU,
                    label: "Diverging RdYlBu"
                  }, {
                    component: "color-scale",
                    colors: COLOR_SCALES.DIVERGING_BUYLRD,
                    value: COLOR_SCALES.DIVERGING_BUYLRD,
                    label: "Diverging BuYlRd"
                  }, {
                    component: "color-scale",
                    colors: COLOR_SCALES.BLUES,
                    value: COLOR_SCALES.BLUES,
                    label: "Blues"
                  }, {
                    component: "color-scale",
                    colors: COLOR_SCALES.REDS,
                    value: COLOR_SCALES.REDS,
                    label: "Reds"
                  }, {
                    component: "color-scale",
                    colors: COLOR_SCALES.YLGNBU,
                    value: COLOR_SCALES.YLGNBU,
                    label: "YlGnBu"
                  },*/ {
                    component: "color-scale",
                    colors: COLOR_SCALES.TWELVE_COLORS,
                    value: COLOR_SCALES.TWELVE_COLORS,
                    label: "12 colors"
                  }, {
                    component: "color-scale",
                    colors: COLOR_SCALES.TWELVE_COLORS_REVERSE,
                    value: COLOR_SCALES.TWELVE_COLORS_REVERSE,
                    label: "12 colors (Reverse)"
                  }, {
                    component: "color-scale",
                    colors: COLOR_SCALES.BLUE_PURPLE,
                    value: COLOR_SCALES.BLUE_PURPLE,
                    label: "Blue purple colors"
                  }, {
                    component: "color-scale",
                    colors: COLOR_SCALES.BREEZE,
                    value: COLOR_SCALES.BREEZE,
                    label: "Breeze theme colors"
                  }
                ]
              }
            }
          }
        }
      },
      about: {
        component: 'items',
        label: 'About',
        items: {
          header: {
            label: 'Radar chart',
            style: 'header',
            component: 'text'
          },
          paragraph1: {
            label: `Radar chart is a two-dimensional chart that uses radical axes to show the
              scoring of a measure in one dimension over another.`,
            component: 'text'
          },
          paragraph2: {
            label: 'Radar chart is based upon an extension created by Brian Booden and VizMatt.',
            component: 'text'
          }
        }
      }
    }
  },
  snapshot: {
    canTakeSnapshot: true
  },
  paint: paint
};
