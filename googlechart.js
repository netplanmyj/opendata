google.charts.load('current', {
  'packages': ['corechart', 'bar', 'table']
});
google.charts.setOnLoadCallback(getData);

function getData() {
    const url = "/wp-content/opendata/gt010103.csv";

    const xhr = new XMLHttpRequest();
    addListeners(xhr);
    // xhr.overrideMimeType('text/csv; charset=Shift_JIS');
    xhr.open("GET", url);
    xhr.send();
    xhr.onload = handleOnLoad;
}

function addListeners(xhr) {
    xhr.addEventListener('loadstart', handleEvent);
    xhr.addEventListener('load', handleEvent);
    xhr.addEventListener('loadend', handleEvent);
    xhr.addEventListener('progress', handleEvent);
    xhr.addEventListener('error', handleEvent);
    xhr.addEventListener('abort', handleEvent);
}

function handleEvent(e) {
    console.log(`${e.type}: ${e.loaded} bytes transferred\n`);
}

function handleOnLoad() {
  const date = new Date(this.getResponseHeader("Last-Modified"));
  const cdata = new CsvData(this.responseText);
  const dataSet = cdata.getOpenData();
  const colLabels = cdata.getColLabels();
  const qdata = cdata.getQuater('2021', 'Q2');
  const dsets = cdata.makeDatasets(qdata, colLabels);
  
  const gchart = new GoogleChart();
  gchart.makeChart('networkChart', dsets, 'chart');

  const gtable = new GoogleTable();
  gtable.drawTable('networkTable', dsets);

  console.log(cdata.getYears());
  console.log(cdata.getQuarters());
}

class GoogleChart {

  makeChart(elementId, chartdata, ctitle) {
    const canvas = document.getElementById(elementId);
    if (canvas == null) {
      return;
    }

    const data = google.visualization.arrayToDataTable(chartdata);
    const options = {
      chart: {
        title: ctitle,
        subtitle: '',
      },
      bars: 'horizontal',
      isStacked: true,
      series: {
        0:{color:'rgb(66, 133, 244)'},
        1:{color:'rgb(219, 68, 55)'},
        2:{color:'rgb(244, 180, 0)'},
        3:{color:'rgb(15, 157, 88)'},
        4:{color:'rgb(171, 71, 188)'},
      }
    };
    const chart = new google.charts.Bar(canvas);
    chart.draw(data, google.charts.Bar.convertOptions(options));
  }

}

class CsvData {

  #csvtext;
  #opendata;
  #collabels;
  #rowlabels;

  constructor(csvtext) {
    this.#csvtext = csvtext;
    this.#opendata = [];
    this.#collabels = [];
    this.#rowlabels = [];
  }

  getOpenData() {
    if (this.#opendata.length > 0) {
      return this.#opendata;
    }
    const lines = this.getLines();
    const re = /,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/
    for (let i = 10; i < lines.length; i++) {
      let cells = lines[i].split(re);
      if (cells[0] == '') {
        continue;
      }
      cells = this.stripData(cells);
      this.#opendata.push(cells);
    }
    return this.#opendata;
  }

  getLines() {
    return this.#csvtext.split('\n');
  }

  stripData(cells) {
    const line = [];
    for (let i = 0; i < cells.length; i++) {
      let c = cells[i].replace(/"/g, '');
      c = c.replace(/,/g, '');
      if (isNaN(Number(c))) {
        line.push(c)
      } else {
       line.push(Number(c));
      }
    }
    return line;
  }

  getColLabels() {
    const lines = this.getLines();
    let line = lines[5].split(',');
    return line.slice(2, 8);
  }

  getQuater(year, quater) {
    let qdata = [];
    for (let i = 0; i < this.#opendata.length; i++) {
      if (this.#opendata[i][0] != year) {
        continue;
      }
      if (this.#opendata[i][1] != quater) {
        continue;
      }
      if (this.#opendata[i][2] == '都道府県計') {
        continue;
      }
      let qline = this.#opendata[i].slice(2, 8);
      qdata.push(qline);
    }
    return qdata;
  }

  makeDatasets(dataset, clabels) {
    const datasets = [];
    datasets.push(clabels);
    for (let i = 0; i < dataset.length; i++) {
      datasets.push(dataset[i]);
    }
    return datasets;
  }

  getYears() {
    let years = this.#opendata.map(item => item[0]);
    years = Array.from(new Set(years));
    return years.sort();
  }

  getQuarters() {
    let quarters = this.#opendata.map(item => item[1]);
    quarters = Array.from(new Set(quarters));
    return quarters.sort();
  }
}

class GoogleTable {
  drawTable(elementId, chartData) {
    const data = google.visualization.arrayToDataTable(chartData);
    const table = new google.visualization.Table(document.getElementById(elementId));
    table.draw(data, {showRowNumber: true, width: '100%', height: '100%'});
  }
}