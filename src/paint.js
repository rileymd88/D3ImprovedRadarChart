import d3 from 'd3';
import displayRADAR from './radarChart';

function paint ($element, layout) {
  const component = this;
  //////////////////////////////////////////////////////////////
  ////////////////////////// Data //////////////////////////////
  //////////////////////////////////////////////////////////////
  var json = convertHYPERCUBEtoJSON(layout);

  var colorpalette = layout.ColorSchema;

  //////////////////////////////////////////////////////////////
  ////////////////////// Set-Up display ////////////////////////
  //////////////////////////////////////////////////////////////

  var options = {
    size: { width: $element.width(), height: $element.height() },									//Width and Height of the circle
    margin: { top: 0, right: 10, bottom: 40, left: 10 },											//The margins around the circle
    legendPosition: { x: 10, y: 10 },																//The position of the legend, from the top-left corner of the svg
    color: d3.scale.ordinal().range(colorpalette),																				//Color function
    colorOpacity: { circle: 0.1, area: 0.2, area_out: 0.1, area_over: 0.6, area_click: 0.8 },		//The opacity of the area of the blob
    roundStrokes: layout.strokeStyle,																//If true the area and stroke will follow a round path (cardinal-closed)
    maxValue: .6,																				//What is the value that the biggest circle will represent
    levels: 6,																					//How many levels or inner circles should there be drawn
    dotRadius: 4, 																				//The size of the colored circles of each blob
    labelFactor: 1.02, 																			//How much farther than the radius of the outer circle should the labels be placed
    wrapWidth: 50, 																				//The number of pixels after which a label needs to be given a new line
    strokeWidth: 2.8, 																			//The width of the stroke around each blob
    legendDisplay: layout.showLegend,															//Display the legend
    numberFormat: getFORMAT(layout)																//Format for number
  };

  //////////////////////////////////////////////////////////////
  //////////////////// Draw the Chart //////////////////////////
  //////////////////////////////////////////////////////////////
  displayRADAR(".radarChart", options, $element, layout, json, component);

}

function getFORMAT(layout) {
  var result = [];
  result[0] = '# ##0,00';
  result[1] = 1;
  result[2] = '';

  if (typeof layout.qHyperCube.qMeasureInfo[0].qNumFormat.qFmt != 'undefined') {
    var formatType 			= layout.qHyperCube.qMeasureInfo[0].qNumFormat.qType;
    var formatDefinition	= layout.qHyperCube.qMeasureInfo[0].qNumFormat.qFmt;
    var formatPrecision		= layout.qHyperCube.qMeasureInfo[0].qNumFormat.qFmt.replace(/%/g, '').trim();

    if(formatType == 'F') {		// Format "Number"
      switch (formatDefinition) {
        case "# ##0":
          result[0] = "# ##0,";
          break;
        default:
          result[0] = formatPrecision;
          break;
      }
    }

    var symbole = formatDefinition.replace(formatPrecision, '').trim();

    if(symbole == '%') {
      result[1] = 100;
      result[2] = '%';
    }
  }

  return result;
}

function convertHYPERCUBEtoJSON(layout) {
  var qMatrix = layout.qHyperCube.qDataPages[0].qMatrix;

  var dim1Labels = qMatrix.map(function(d) {
    return d[0].qText;
  });
  var dim1Id = qMatrix.map(function(d) {
    return d[0].qElemNumber;
  });
  var dim1IsNullAtIndex = qMatrix.map(function(d) {
    if (d[0].hasOwnProperty('qIsNull')){
      return d[0].qIsNull;
    }
  });
  var dim2Labels = qMatrix.map(function(d) {
    return d[1].qText;
  });
  var dim2Id = qMatrix.map(function(d) {
    return d[1].qElemNumber;
  });
  var dim2IsNullAtIndex = qMatrix.map(function(d) {
    if (d[1].hasOwnProperty('qIsNull')){
      return d[1].qIsNull;
    }
  });
  var metric1Values = qMatrix.map(function(d) {
    return d[2].qNum;
  }) ;

  const hasInvalidMetricValue = !!metric1Values.find(metricValue => isNaNOrStringNaN(metricValue));
  const hasInvalidData = hasInvalidMetricValue;
  if (hasInvalidData) {
    return null;
  }
  
  // create a JSON array that contains dimensions and metric values
  var data = [];
  var actClassName = "";
  var myJson = {};
  myJson.dim_id = "";
  myJson.dim = "";
  myJson.definition = [];
  var cont = 0;
  var contdata = 0;
  var LegendValues = [];
  for(var k=0;k<dim1Labels.length;k++){
    if(actClassName!=dim1Labels[k] ){
      if(cont!=0){
        data[contdata] = myJson;
        contdata++;
      }
      // it is a different grouping value of Dim1
      LegendValues.push(dim1Labels[k]);
      var myJson = {};
      myJson.dim_id = "";
      myJson.dim = "";
      myJson.definition = [];
      cont = 0;
      myJson.dim_id = dim1Id[k];
      myJson.dim = dim1Labels[k];
      // Make sure radar_area is added for usage in the radar chart layers later
      myJson.definition[cont] = { "axis_id" : dim2Id[k], "axis" : dim2Labels[k], "radar_area_id" : dim1Id[k], "radar_area" : dim1Labels[k], "value" : metric1Values[k] };
      dim2IsNullAtIndex[k] ? myJson.definition[cont].dim2IsNull = dim2IsNullAtIndex[k] : null;
      dim1IsNullAtIndex[k] ? myJson.definition[cont].dim1IsNull = dim1IsNullAtIndex[k] : null;
      cont++;
    // Make sure radar_area is added for usage in the radar chart layers later
    }
    else{
      myJson.definition[cont] = { "axis_id" : dim2Id[k], "axis" : dim2Labels[k], "radar_area_id" : dim1Id[k], "radar_area" : dim1Labels[k], "value" : metric1Values[k] };
      dim2IsNullAtIndex[k] ? myJson.definition[cont].dim2IsNull = dim2IsNullAtIndex[k] : null;
      dim1IsNullAtIndex[k] ? myJson.definition[cont].dim1IsNull = dim1IsNullAtIndex[k] : null;
      cont++;
    }
    actClassName = dim1Labels[k];
  }
  data[contdata] = myJson;
  return {
    data,
    isValid: true
  };
}

export default paint;

function isNaNOrStringNaN (input) {
  if (!input) {
    return false;
  }
  return isNaN(input) || input === 'NaN';
}

