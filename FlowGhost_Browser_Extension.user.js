// ==UserScript==
// @name          Flowghost Browser Extension
// @namespace     http://www.sakai.duke.com
// @require       http://d3js.org/d3.v3.min.js
// @require       http://ajax.aspnetcdn.com/ajax/jquery/jquery-1.7.2.js
// @require       http://netdna.bootstrapcdn.com/bootstrap/3.0.0/js/bootstrap.min.js
// @require       https://github.com/typicaljoe/taffydb/raw/master/taffy.js
// @resource      bootstrap http://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css
// @grant         GM_addStyle
// @grant         GM_getResourceText
// @description   A Greasemonkey script that provides virtualization of student grades in Duke Sakai.
// @include       /https://sakai\.duke\.edu/portal/tool/[\w-]+/studentView\.jsf*/
// ==/UserScript==

GM_addStyle(GM_getResourceText("bootstrap"));

// Add style for svg
var css = 'svg {display: block; margin: 0 auto; } .svg-tooltip {pointer-events: none; } .tooltip {padding: 10px; color: #4A22FF; } .lead {font-style: italic; } #visualization {border:2px solid; border-radius:25px; } node {stroke: #fff; stroke-width: 1.5px; z-index: -1; } path.link {fill: none; stroke: #666; stroke-width: 1.5px; } text {fill: #000; font: 14px sans-serif; pointer-events: none; } box {width: 300px; padding: 25px; border: 25px solid navy; margin: 25px; }',
head = document.head || document.getElementsByTagName('head') [0],
style = document.createElement('style');
style.type = 'text/css';
if (style.styleSheet) {
  style.styleSheet.cssText = css;
} else {
  style.appendChild(document.createTextNode(css));
}
head.appendChild(style);

var taglit; // Cond: global condition variable based on user selection
var selectedTags = new Array;
var operator;
var nodesToDisplay = [];
var tags = Object.create(null);

GetCellValues();

var all = TAFFY(nodesToDisplay);
// alert(JSON.stringify(all().get()));
// alert(JSON.stringify(tags));
// var tooltip = d3tooltip(d3) 

// alert(JSON.stringify(nodesToDisplay));
var width = 1100;
var height = 500;
// var totalPoints = 0;
var totalSize = 0;
for (var i = 0; i < nodesToDisplay.length; ++i) {
  totalSize += nodesToDisplay[i].mySize;
}
var maxNodeSize = 10000;
var color = d3.scale.category10();
var force = d3.layout.force();
var scaleColor = d3.scale.linear().domain([0, 1]).range(['red', 'green']);

if (! ($.isEmptyObject(tags))) {
  // tag checkbox HTML
  var tagHTML = '<form name="tags_in" ,="" id="tags_in">';
  for (var tag in tags) {
    tagHTML += '<input id="' + tag + '" name="' + tag + '" type="checkbox" value="1" style="margin-left: 5px; margin-right: 2px;">' +
      '<label class="btn btn-default btn-sm" for="' + tag + '">' + tag + '</label>';
  }
  tagHTML += '</form><br>';

  // add checkbox and bottons
  document.getElementsByTagName('body') [0].innerHTML += 
  '<div class="text-center">' +
  tagHTML + 
  '<span class="btn btn-primary text-center" id="filterButton">Filter</span>' +
  '<input class="btn btn-primary text-center" value="See all" onclick="history.go(0)" style="width: 74px; margin-left: 5px">' +
  '<br/><br/></div>' +
  '<div class="col-md-12" id="visualization"></div>';
  
  document.getElementById ("filterButton").addEventListener ("click", updateConditionFilter, false );

  displayNodes();
}
else if (nodesToDisplay.length != 0) {
  document.getElementsByTagName('body') [0].innerHTML += '<div class="col-md-12" id="visualization"></div>';
  displayNodes();
}

function tagfilter() {
  var assignmentTags = this.tagnames.split(',');
  console.log('*** tagfilter: assignmentTags are ' + assignmentTags);
  if (operator == 'or') {
    for (var i = 0; i < assignmentTags.length; i++) {
      for (var j = 0; j < selectedTags.length; j++) {
        if (assignmentTags[i] == selectedTags[j]) {
          //alert("tagfilter: "+JSON.stringify(assignmentTags[i]));
          return true;
        }
      }
    }
    return false;
  }
  //AND

  if (operator == 'and') {
    var i = 0;
    var flag;
    checkSelected:
    for (var i = 0; i < selectedTags.length; i++) {
      //alert("checking for "+selectedTags[i]);
      flag = false;
      for (var j = 0; j < assignmentTags.length; j++) {
        //	alert(JSON.stringify(assignmentTags[j]));
        if (selectedTags[i] == assignmentTags[j]) {
          //alert(JSON.stringify(assignmentTags[j]));
          flag = true;
        }
      }
      if (!flag) {
        //	alert("returning false");
        return false;
      }
    }
    //alert("returning true");

    return true;
  }
}
function updateConditionFilter() {
  var x = document.forms['tags_in'];
  selectedTags = new Array;
  for (var i = 0; i < x.length; i++) {
    //		alert(x.elements[i].checked);
    if (x.elements[i].checked) {
      selectedTags.push(x.elements[i].name);
      console.log('^^^^^^^^ ' + x.elements[i].name + ' is pushed onto selectedTags');
    }
  }
  operator = 'or';
  //Need to rename for more accurate description.
  nodesToDisplay = all(tagfilter).get();
  console.log('^^^^^^^^^^^ after tagfilter: nodesToDisplay are ' + nodesToDisplay);
  d3.select('svg').remove();
  displayNodes();
}

function addTags(titleCell) {
  switch (titleCell.innerHTML) {
    case 'Homework 1': titleCell.innerHTML += '  # basic concept '; break;
    case 'Homework 2': titleCell.innerHTML += '  # basic concept # rv # discete rv '; break;
    case 'Homework 3': titleCell.innerHTML += '  #rv # discete rv #continuous rv'; break;
    case 'Homework 4': titleCell.innerHTML += '  # rv # continuous rv'; break;
    case 'Homework 5': titleCell.innerHTML += '  # RBD # fault tree'; break;
    case 'Homework 6': titleCell.innerHTML += '  # expectation '; break;
    case 'Homework 7': titleCell.innerHTML += '  # expectation '; break;
    case 'Homework 8': titleCell.innerHTML += '  # MC # RBD'; break;
    case 'Homework 9': titleCell.innerHTML += '  # MC # CTMC '; break;
    case 'Homework 10': titleCell.innerHTML += '  #MC # CTMC '; break;
    case 'Homework 11': titleCell.innerHTML += '  #MC # DTMC '; break;
    case 'Midterm': titleCell.innerHTML += '  #basic concept #rv #discete rv #continuous rv #expectation'; break;
    case 'Final Exam': titleCell.innerHTML += '  #RBD # fault tree #MC #CTMC #DTMC'; break;
  }
}

function GetCellValues() {
  var table = document.getElementsByClassName('listHier wideTable lines') [0];
  var headers = table.getElementsByTagName('th');
  var titleIndex, gradeIndex, weightIndex;
  for (var c = 0; c < headers.length; c++) {
    if (headers[c].innerHTML.indexOf('Title') > - 1) titleIndex = c;
    if (headers[c].innerHTML.indexOf('Grade*') > - 1) gradeIndex = c;
    if (headers[c].innerHTML.indexOf('Weight') > - 1) weightIndex = c;
  }
  if (typeof titleIndex === 'undefined' || typeof gradeIndex === 'undefined') return;
  // var rows = document.getElementsByClassName(className);
  var rows = $('.listHier > tbody > tr');
  var weight = 1.0, nodes = [];
  for (var r = 0, n = rows.length; r < n; r++) {
    var cells = rows[r].cells;
    if (rows[r].className === "") {
      pushToNodesToDisplay(nodes);
      weight = getWeight(weight, weightIndex, cells);
      nodes = [];
      continue;
    }
    if (cells[gradeIndex].innerHTML.indexOf('/') === - 1) continue;
    var newNode = {};
    newNode.tagnames = '';

    // addTags(cells[titleIndex]);

    var nameAndTags = cells[titleIndex].innerHTML.split('#');
    newNode.name = nameAndTags[0].trim();
    for (var i=1; i<nameAndTags.length; i++) {
      var tag = nameAndTags[i].trim();
      if (newNode.tagnames === '') newNode.tagnames = tag;
      else newNode.tagnames = newNode.tagnames + ',' + tag;
      if (!(tag in tags)) tags[tag] = true;
    }
    var twoPoints;
    if (cells[gradeIndex].getElementsByTagName('span').length != 0) {
      twoPoints = cells[gradeIndex].getElementsByTagName('span')[0].innerHTML.split('/');
    }
    else {
      twoPoints = cells[gradeIndex].innerHTML.split('/');
    }
    newNode.points = parseInt(twoPoints[0]);
    newNode.points_possible = parseInt(twoPoints[1]);
    newNode.parentWeight = weight;
    newNode.myWeight = getWeight('', weightIndex, cells);
    nodes.push(newNode);
    // nodesToDisplay.push(newNode);
  }
  pushToNodesToDisplay(nodes);
}

function pushToNodesToDisplay(nodes) {
  var n = nodes.length;
  var totalPoints = 0;
  for (var i=0; i<n; ++i) totalPoints += nodes[i].points_possible;
  nodes.forEach(function(node) {
    if (node.myWeight === '') {
      node.mySize = node.points_possible * node.parentWeight / totalPoints;
    }
    else {
      node.mySize = node.parentWeight * node.myWeight;
    }
    nodesToDisplay.push(node);
  });
}

function getWeight(weight0, weightIndex, cells) {
  if (typeof weightIndex === 'undefined') return weight0;
  var weightStr = cells[weightIndex].innerHTML;
  if (weightStr === "") return weight0;
  return parseFloat(weightStr) / 100.0;
}

function displayNodes() {
  var svg = d3.select('#visualization').append('svg').attr('width', width).attr('height', height);
  //add the tooltips
  var div = d3.select('#visualization').append('div').attr('class', 'tooltip').style('opacity', 0);
  // var nodes = JSON.parse(nodesToDisplay.stringify()) ;
  var nodes = nodesToDisplay;
  console.log(nodes);
  force.nodes(nodes).size([width,
  height]).charge( - 160).on('tick', tick).start();
  // define the nodes
  var node = svg.selectAll('node').data(force.nodes()).enter().append('g').attr('class', 'node').style('position', 'relative').call(force.drag);
  //add node shape
  node.append('path').attr('d', d3.svg.symbol().type(function (d) {
    return d3.svg.symbolTypes[0];
  }).size(function (d) {
    return d.mySize / totalSize * maxNodeSize;
  })).style('fill', function (d) {
    return scaleColor(d.points / d.points_possible);
  }).style('opacity', 1);
  //add details
  node.append('text').attr('dx', function (d) {
    return Math.sqrt(d.mySize / totalSize * maxNodeSize);
  }).text(function (d) {
    //return d.name+", "+d.points+"/"+d.points_possible;
    // return d.name.substring(0, 5) + '..'
    return d.name;
  });
  /*
  node.append('text').attr('dx', function (d) {
    return Math.sqrt(d.points_possible / totalPoints * maxNodeSize);
  }).attr('dy', 10).text(function (d) {
    return $.map(d.tagnames.split(','), function (val) {
      return val;
    })
  });
  */
  node.on('mouseover', showDetails).on('mouseout', hideDetails)
  function showDetails() {
    d3.select(this).select('path').style('stroke', 'black').style('stroke-width', 2)
    d3.select(this).select('text').text(function (d) {
      return d.name
    })
    //d3.select(this).selectAll(function() { return this.getElementsByTagName("foreignObject"); }).style("opacity", 0.7).style("display","inline").style("z-index",300).html("<p></p>")
    d3.select(this).append('foreignObject').attr('width', 400).attr('height', 500).style('display', 'inline').append('xhtml:pre').style('background-color', 'purple').style('color', 'yellow').style('z-index', 3).append('xhtml:p').text(function (d) {
      var nameAndPoints = 'name: ' + d.name + '\n' + 'points: ' + d.points + '/' + d.points_possible;
      if (d.tagnames) {
        var tags = '\ntags: ' + (d.tagnames.split(',').join(', ')).match(/.{1,40}/g).join('\n      ');
        return nameAndPoints + tags;
      }
      else {
        return nameAndPoints;
      }
    })
  }
  function hideDetails() {
    d3.select(this).select('text').text(function (d) {
      // return d.name.substring(0, 3) + '..'
      return d.name;
    })
    d3.select(this).select('path').style('stroke', 'white').style('stroke-width', 0)
    d3.select(this).selectAll(function () {
      return this.getElementsByTagName('foreignObject');
    }).style('display', 'none')
  }
  function tick() {
    node.attr('transform', function (d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    });
  }
}
/*  
*/
