
/** initSmartSNR Ajax GET request. 
 * For example: //url: http://192.168.1.56/public?command=initSmartSNR&state=on&mode=snr&freq=1231&sr=63000&pol=1&tone=0
*/

  function initSmartSNR() {

    var countsDown = $("#countsDown").text();
    var uzenet = new sendMessage(
        '#success', 
        'Data is coming in all the time!',
        true, null, 15000
    );

    if (!countsDown || countsDown == 'Kész!') {

      $("#countsDown").html("");
      $("#status").html("");

      var ipText = localStorage.getItem("ip");
      var ip_valid = isValidIP(ipText);
      var ip = (!ip_valid)?alert("Invalid IP: "+ipText+"!"):ipText;
      var freq = Number(localStorage.getItem("freq"));
      var freq_lo = Number(localStorage.getItem("freq_lo"));
      var freq_if = (freq - freq_lo);
      var sr = localStorage.getItem("sr");
      var pol = Number(localStorage.getItem("pol"));
      var tone = Number(localStorage.getItem("tone"));
      var dsq = localStorage.getItem("dsq");
      var slnbe = Number(localStorage.getItem("slnbe"));
      var url = 'http://'+ip+'/public';
      var params = {
          command: 'initSmartSNR',
          state: 'on',
          mode: 'snr',
          freq: freq_if,
          sr: sr,
          pol: pol,
          tone: tone,
          diseqc_hex: dsq,
          smart_lnb_enabled: slnbe
      };
      $.ajax({
          url: url,
          method: 'GET',
          data: params,
          dataType: 'text',
          success: function(response) {
              // In the event of a successful response
              $("#status").html(" under process!");
              startEvents();
          },
          error: function(xhr, status, error) {
              // Hiba kezelése
              var uzenet = new sendMessage(
                  '#alert', 
                  'An error occurred while sending data: ' + status + error,
                  true, null, 5000
              );
              uzenet.view();
          }
      });
      
    }else{
      uzenet.view();
    }
  } 

  function isValidIP(ip) {
    // Regex pattern
    var ipPattern = /^(25[0-5]|2[0-4]\d|[01]?\d{1,2})(\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})){3}$/;
    // We check the IP address using the pattern
    return ipPattern.test(ip);
  }

/** startEvents Ajax GET request. 
 * For example: // url: http://192.168.1.56/public?command=startEvents
*/

  function startEvents() {
      moveBar();
      var c = 0;
      function myCounter() {
        $("#countsDown").html(++c + " sec");
      }
      myTimer = setInterval(myCounter, 1000);
      var ip = localStorage.getItem("ip");
      var url = "http://"+ip+"/public";
      var params = {
            command: 'startEvents'
      };
      $.ajax({
        url: url,
        method: 'GET',
        data: params,
        dataType: 'text',
        success: function (response) {
          // In the event of a successful response

          // stop counter
          clearInterval(myTimer);

          // timestamp
          var timestamp = new Date().getTime();
          var i = 0;

          // Breakdown into lines - every 16th line (result per second approx. 333/16)
          var lines = response.trim().split('\n');

          // Creating objects
          var eventData = lines
            .filter((line, index) => (index + 1) % 16 === 0 && line.includes('data:'))
            .map(line => {
              try {
                var data = JSON.parse(line.substring(line.indexOf('{')));
                data.timestamp = timestamp+i;
                i += 1000;
                return data;
              } catch (e) {
                $("#alert").html('Error processing data: ' + e);
                return null;
              }
            })
            .filter(item => item !== null); 
          
          /*// Split into rows - each row
          var lines = response.trim().split('\n');

          // Creating objects
          var eventData = lines
            .filter(line => line.includes('data:'))
            .map(line => {
              try {
                var data = JSON.parse(line.substring(line.indexOf('{')));
                var timestamp = new Date().getTime(); 
                data.timestamp = timestamp;
                return data;
              } catch (e) {
                $("#alert").html('Error processing data: ' + e);
                return null;
              }
            })
            .filter(item => item !== null);*/

          // Ell.:
          // console.log(eventData);

          // Data handling
          addDataIndexedDB(eventData);

          // Show graph
          drawChart();

          writeData();

          // Manage messages
          $("#countsDown").html("Kész!");
          $("#status").html("OFF");
        },
        error: function (xhr, status, error) {
          // Error handling
          var uzenet = new sendMessage(
            '#alert',
            'An error occurred while sending data: ' + status + "; " + error,
            true, null, 5000
          );
          uzenet.view();
          clearInterval(myTimer);
        }
      });
  }


/** Graph */
  // Data query from the data table based on key
  function getDataKey(response, key) {
    var yData = [];
    var keyData = [];
    for (var x in response) {
      keyData.push(response[x][key]);
    }
    yData = (keyData) ? keyData: [];
    return yData;
  }
  // Date Formatting
  function formatDateLocal(element) {
    let dateLocal = [];
    for (const x in element) {
      let d = new Date(element[x]).toLocaleString();
      dateLocal.push(d);
    }
    return dateLocal;
  }

  function drawChart(){

    var ySnrValues = [];
    var yLmSnrValues = [];
    var yLnbVoltageValues = [];
    var yPsuVoltageValues = [];

    getAllStorageData().then(allData => {
      // Creating data
      // y data
      ySnrValues = getDataKey(allData, "snr");
      yLmSnrValues = getDataKey(allData, "lm_snr");
      yLnbVoltageValues = getDataKey(allData, "lnb_voltage");
      yPsuVoltageValues = getDataKey(allData, "psu_voltage");

      // x data
      var timestamp = getDataKey(allData, "timestamp");

        var plotdata1 = {
            yData1: ySnrValues,
            yData2: yLmSnrValues,
            name1: 'SNR',
            name2: 'LM SNR',
            timestamp: timestamp
        };
        drawChartFromStorage("myPlot1", "Signal-to-noise ratio", plotdata1)

        var plotdata2 = {
            yData1: yLnbVoltageValues,
            yData2: yPsuVoltageValues,
            name1: 'LNB Voltage',
            name2: 'PSU Voltage',
            timestamp: timestamp
        };
        drawChartFromStorage("myPlot2", "Voltages", plotdata2)
      
    }).catch(error => {
      console.error(error);
    });
  }

/** Other data */

  function writeData() {
      
      getAllStorageData().then(allData => {

        if (allData.length != 0) {

            var alfa = getDataKey(allData, "alfa");
            $("#alfa").html(alfa[0] + "°");
            var beta = getDataKey(allData, "beta");
            $("#beta").html(beta[0 ]+ "°");
            var gamma = getDataKey(allData, "gamma");
            $("#gamma").html(gamma[0] + "°");
            var lock = getDataKey(allData, "lock");
            var lockVal = (lock[0] == 0) ? "not locked" : "locked" ;
            $("#lock").html(lockVal);
            var lnb_current = getDataKey(allData, "lnb_current");
            $("#lnb_current").html(lnb_current[0] + " mA");

            var timestamp = getDataKey(allData, "timestamp");
            var fromdate = new Date(timestamp[0]).toLocaleString();
            $("#fromdate").html(fromdate);
            var todate = new Date(timestamp[timestamp.length-1]).toLocaleString(); 
            $("#todate").html(todate);
            
            var measureLength = allData.length;
            $("#length").html(measureLength);
  
        }
      }).catch(error => {
        console.error(error);
      });
  }

/** Time limit report */

  localStorage.setItem("stop", 0);

  function reportTimes() {
    var setTime = $("#setTime").val();
    if (setTime>0) {
      var uzenet = new sendMessage(
          "#success",
          "Request started!",
          true, null, 5000
      );
      uzenet.view();
      var reportTimes = setInterval(function() {
          var stop = localStorage.getItem("stop");
          if (stop == 0) {
              initSmartSNR();
          } else {
              var uzenet = new sendMessage(
                  "#success",
                  "The \"Time Limit\" request is stopped!",
                  true, null, 5000
              );
              uzenet.send();
              clearInterval(reportTimes);
          }
      }, 2000);
      setTimeout(function() {
          var stop = localStorage.getItem("stop");
          if (stop == 0) { 
              clearInterval(reportTimes);
              var uzenet = new sendMessage(
                  "#success",
                  "It will be ready soon.",
                  true, null, 5000
              );
              uzenet.send();
          }
      }, setTime * 60 * 1000);
    }else{
      var uzenet = new sendMessage(
          "#alert",
          "Set the time!",
          true, null, 5000
      );
      uzenet.send();
    }
  }

/** Stop initSmartSNR request:  
 * For example: //url: http://192.168.1.56/public?command=initSmartSNR&state=off
*/

  function stopReport() {
    localStorage.setItem("stop", 1);
    $("#countsDown").html("");
    $("#status").html("");
    var ip = localStorage.getItem("ip");
    var url = 'http://' + ip + '/public';
    var params = {
      command: 'initSmartSNR',
      state: 'off'
    };
    $.ajax({
      url: url,
      method: 'GET',
      data: params,
      dataType: 'html',
      success: function (response) {
        // In the event of a successful response
        $("#status").html("Stopped!");
      },
      error: function (xhr, status, error) {
        // Error handling
        var uzenet = new sendMessage(
            '#alert',
            'An error occurred while sending data: ' + status + error ,
            true, null, 5000
        );
        uzenet.view();
      }
    });
  }

/** progress bar  */

  var i = 0;
  function moveBar() {
    if (i == 0) {
      i = 1;
      var elem = document.getElementById("myBar");
      var width = 0;
      var id = setInterval(frame, 1000);
      function frame() {
        if (width >= 100) {
          clearInterval(id);
          i = 0;
          elem.style.width = "0%";
        } else {
          width += 5;
          elem.style.width = width + "%";
        }
      }
    }
  }

/** Get IDB all data */

function getAllStorageData() {
  return new Promise((resolve, reject) => {
      getAllDataIndexedDB().then(data => {
          // Let's work with the data here
          let responseData = data; // We store the data in the responseData variable
          var response = [];
          for (var x in responseData) {
              response.push(responseData[x]);
          }
          let allStorageData = response.reduce((acc, curr) => acc.concat(curr), []);
          resolve(allStorageData);
      }).catch(error => {
          reject(error);
      });
  });
}

// get Form elements

function getFormValue(key){
  $("#"+key).change(function(){
    var p = $('#'+key).val();
    localStorage.setItem(key, p);
  });
  var p = localStorage.getItem(key);
  $("#"+key).val(p);
}

/** After the page loads */

$(function(){

// Default position of messages

  $("#alert").click(function(){
    $("#alert").hide('slow');
  });

  $("#success").click(function(){
    $("#success").hide('slow');
  });

// Manage form elements

  getFormValue('ip');
  getFormValue('freq');
  getFormValue("freq_lo");
  getFormValue('sr');
  getFormValue('pol');
  getFormValue('tone');
  getFormValue('dsq');
  getFormValue('slnbe');

// Button management

  // Time Limit / SNR Report
  $("#report").click(function(){
    localStorage.setItem("stop", 0);
    reportTimes();
  });
  
  // SNR Report
  $("#snrReport").click(function(){
    initSmartSNR();
    var uzenet = new sendMessage(
        "#success",
        "The request has been started.",
        true,null,5000
    );
    uzenet.send();
  });

  // Stop SNR Report
  $("#stop").click(function(){
    stopReport();
    var uzenet = new sendMessage(
        "#success",
        "The request has been stopped.",
        true,null,5000
    );
    uzenet.send();
  });

  // Delete all data from indexedDB 
  $("#clearls").click(function(){
    if (!confirm("Are you sure you want to delete the data?", "")) return;
    // clearIDB function call
    clearIDB().then(message => {
        var uzenet = new sendMessage(
            "#success",
            message,
            true, null, 5000
        );
        uzenet.send(); // The content of the data storage has been successfully deleted
      }).catch(error => {
        var uzenet = new sendMessage(
            "#alert",
            error,
            true, null, 5000
        );
        uzenet.send();
        console.error(error);
      });
    drawChart();
    writeData();
  });

  // Save as JSON / Export as XlLSX - Generating buttons
  $('#save').click(function () {
    getAllStorageData().then(allData => {
      var jsonData = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData));
      var d = new Date();
      var yy = d.getFullYear();
      var mm = d.getMonth()+1;
      var dd= d.getDate();
      var message = `onclick="return confirm('Do you save the data to an json file?')"`;
      $('#downloadJson').html('<a href="data:' + jsonData + '" download="SnrReport' + yy + '_' + mm + '_' + dd + '.json" ' + message + '><li>Download JSON</li></a>');
      $('#exportJson').html('<li>Export as XLSX</li>');
    }).catch(error => {
      console.error(error);
    });
  });

  // Download JSON / Export as XLSX hidden 
  $('.downloadJson').click(function(){
    $('#downloadJson').html("");
    $('#exportJson').html("");
  });
  $('.exportJson').click(function(){
    $('#exportJson').html("");
    $('#downloadJson').html("");
  });
  
  // Export json to xlsx
  $("#exportJson").click(function(){
    if (!confirm("Do you save the data to an xlsx file?", "")) return;
    getAllStorageData().then(allData => {
      // export xlsx
      var filename = "snrReport.xlsx";
      var wb = XLSX.utils.book_new();
      var ws = XLSX.utils.json_to_sheet(allData);
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb,filename);
    }).catch(error => {
      console.error(error);
    });

  });

  drawChart();

  writeData();

});