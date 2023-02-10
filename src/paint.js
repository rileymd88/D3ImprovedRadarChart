var qlik = window.require("qlik");
import d3 from "d3";
import displayRADAR from "./radarChart";

function paint($element, layout) {
  const component = this;
  const app = qlik.currApp(this);
  //////////////////////////////////////////////////////////////
  ////////////////////////// Data //////////////////////////////
  //////////////////////////////////////////////////////////////
  var json = convertHYPERCUBEtoJSON(layout);

  function getProperty(obj, prop) {
    var parts = prop.split(".");
    if (Array.isArray(parts)) {
      var last = parts.pop(),
        l = parts.length,
        i = 1,
        current = parts[0];
      while ((obj = obj[current]) && i < l) {
        current = parts[i];
        i++;
      }
      if (obj) {
        return obj[last];
      }
    } else {
      throw "parts is not valid array";
    }
  }

  const getColorPallette = async (app, layout) => {
    if (layout.colorByDimension) {
      const colorMapRef = getProperty(
        layout,
        "qHyperCube.qDimensionInfo.0.coloring.colorMapRef"
      );
      if(typeof colorMapRef !== 'undefined') {
        const colarMapObject = await app.getObject(`ColorMapModel_${colorMapRef}`);
        const colorMapLayout = await colarMapObject.getLayout();
        return colorMapLayout.colorMap.colors.map(c => c.baseColor.color);
      }
      else {
        return layout.ColorSchema;
      }
    }
    else {
      return layout.ColorSchema;
    }
  };
  
  const setup = async (app, layout, $element) => {
    var options = {
      size: { width: $element.width(), height: $element.height() },
      margin: { top: 0, right: 10, bottom: 40, left: 10 },
      legendPosition: { x: 10, y: 10 },
      colorOpacity: {
        circle: 0.1,
        area: 0.2,
        area_out: 0.1,
        area_over: 0.6,
        area_click: 0.8,
      },
      roundStrokes: layout.strokeStyle,
      maxValue: 0.6,
      levels: 6,
      dotRadius: 4,
      labelFactor: 1.02,
      wrapWidth: 50,
      strokeWidth: 2.8,
      legendDisplay: layout.showLegend,
      numberFormat: getFORMAT(layout),
    };
  
    const colorPalette = await getColorPallette(app, layout);
    options.color = d3.scale.ordinal().range(colorPalette);
    //////////////////////////////////////////////////////////////
    //////////////////// Draw the Chart //////////////////////////
    //////////////////////////////////////////////////////////////
    displayRADAR(".radarChart", options, $element, layout, json, component, app);
  };
  setup(app, layout, $element);
}

function getFORMAT(layout) {
  var result = [];
  result[0] = "# ##0,00";
  result[1] = 1;
  result[2] = "";

  if (typeof layout.qHyperCube.qMeasureInfo[0].qNumFormat.qFmt != "undefined") {
    var formatType = layout.qHyperCube.qMeasureInfo[0].qNumFormat.qType;
    var formatDefinition = layout.qHyperCube.qMeasureInfo[0].qNumFormat.qFmt;
    var decSeparator = layout.qHyperCube.qMeasureInfo[0].qNumFormat.qDec;
    var formatPrecision = layout.qHyperCube.qMeasureInfo[0].qNumFormat.qFmt
      .replace(/%/g, "")
      .trim();

    if (formatType == "F") {
      // Format "Number"
      if (formatDefinition.indexOf(decSeparator) === -1) {
        result[0] = formatDefinition + decSeparator;
      } else {
        result[0] = formatPrecision;
      }
    }

    var symbole = formatDefinition.replace(formatPrecision, "").trim();

    if (symbole == "%") {
      result[1] = 100;
      result[2] = "%";
    }
  }

  return result;
}

function convertHYPERCUBEtoJSON(layout) {
  var DIM1_LIMIT =100;
  var DIM2_LIMIT =100;
  var qMatrix = layout.qHyperCube.qDataPages[0].qMatrix;

  var structure = [];
  var dim1Indecies = {};
  var dim2Indecies = {};
  var uniqueDim2Labels = [];
  var uniqueDim2Ids = [];
  var uniqueDim1Ids = [];
  var data = [];

  // filtering out qMatrix to take first 100 unique dimension 1 values.
  for(var index = 0; index<qMatrix.length; index++){
    if (uniqueDim1Ids.indexOf(qMatrix[index][0].qElemNumber) === -1 && uniqueDim1Ids.length<DIM1_LIMIT) {
      uniqueDim1Ids.push(qMatrix[index][0].qElemNumber);
    }
    if(uniqueDim1Ids.indexOf(qMatrix[index][0].qElemNumber) !== -1){
      data.push(qMatrix[index]);
    }
  }

  data.forEach(function(row) {
    if (uniqueDim2Ids.indexOf(row[1].qElemNumber) === -1 && uniqueDim2Ids.length<DIM2_LIMIT) {
      dim2Indecies[row[1].qElemNumber] = uniqueDim2Ids.length;
      uniqueDim2Ids.push(row[1].qElemNumber);
      uniqueDim2Labels.push(row[1].qText);
    }
  });

  data.forEach(function(row) {
    if (dim1Indecies[row[0].qElemNumber] === undefined) {
      // create first dim
      dim1Indecies[row[0].qElemNumber] = structure.length;
      structure.push({
        dim: row[0].qText,
        dim_id: row[0].qElemNumber,
        definition: uniqueDim2Ids.map(function(qEle, index) {
          return {
            axis_id: qEle,
            axis: uniqueDim2Labels[index],
            radar_area_id: row[0].qElemNumber,
            radar_area: row[0].qText,
            value: NaN
          };
        })
      });
    }
    // add to second dim
    if(typeof dim2Indecies[row[1].qElemNumber] !== 'undefined'){
      structure[dim1Indecies[row[0].qElemNumber]].definition[
        dim2Indecies[row[1].qElemNumber]
      ].value = isNaN(row[2].qNum)? 0: row[2].qNum;
    }

    // Check if null
    if (row[0].qIsNull && typeof dim2Indecies[row[1].qElemNumber] !== "undefined") {
      structure[dim1Indecies[row[0].qElemNumber]].definition[
        dim2Indecies[row[1].qElemNumber]
      ].dim1IsNull = true;
    }
  });

  var metric1Values = data.map(function(d) {
    return d[2].qNum;
  });

  const hasOnlyInvalidMetricValue = metric1Values.every(metricValue =>
    isNaNOrStringNaN(metricValue)
  );
  if (hasOnlyInvalidMetricValue) {
    return null;
  }

  return structure;
}

export default paint;

function isNaNOrStringNaN(input) {
  if (!input) {
    return false;
  }
  return isNaN(input) || input === "NaN";
}
