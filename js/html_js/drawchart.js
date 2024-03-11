/** Chart */

  function drawChartFromStorage(id, title, data = []){
 
    var title = (title) ? title : "" ;
    var timestamp = (data) ? data.timestamp : [] ;
    var xValue = [];
    for (let x in timestamp){
        let d = new Date(timestamp[x]).toLocaleString();
        xValue.push(d);
    }
    var yData1 = (data) ? data.yData1 : [] ;
    var name1 = (data) ? data.name1 : "" ;
    var yData2 = (data) ? data.yData2 : [] ;
    var name2 = (data) ? data.name2 : "" ;

    // Define Data
    const chartdata = [
      {
        x: xValue,
        y: yData1,
        mode: "lines",
        name: name1
      },
      {
        x: xValue,
        y: yData2,
        mode: "lines",
        name: name2
      }
    ];

    // Define Layout
    const layout = {
      title: title,
      showlegend: true/*,
      legend: {
          orientation: "h",
          xref: "container",
          yref: "container",
          xanchor: "left",
          yanchor: "top"
      }*/
    };

    // Define Config
    const config = {
      displaylogo: false,
      responsive: true
    };

    // Display using Plotly
    Plotly.newPlot(id, chartdata, layout, config);

  }
