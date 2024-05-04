/** list of keys stored in localstorage */
  const localStorageKeys = {
    IP: 'ip',
    FREQ: 'freq',
    FREQ_LO: 'freq_lo',
    SR: 'sr',
    POL: 'pol',
    TONE: 'tone',
    DSQ: 'dsq',
    SLNBE: 'slnbe',
    SET_TIME: 'setTime',
    STOP: 'stop',
    RUN: 'run',
    ERROR: 'error'
  };

  localStorage.setItem(localStorageKeys.RUN, 0);
  localStorage.setItem(localStorageKeys.STOP, 0);
  localStorage.setItem(localStorageKeys.SET_TIME, 0);

/** initSmartSNR GET request. 
 * For example: //url: http://192.168.1.4/public?command=initSmartSNR&state=on&mode=snr&freq=1231&sr=63000&pol=1&tone=0
 */
async function initSmartSNR() {
  try {
      var ip = localStorage.getItem(localStorageKeys.IP);
      var freq = Number(localStorage.getItem(localStorageKeys.FREQ));
      var freq_lo = Number(localStorage.getItem(localStorageKeys.FREQ_LO));
      var freq_if = (freq - freq_lo);
      var sr = localStorage.getItem(localStorageKeys.SR);
      var pol = Number(localStorage.getItem(localStorageKeys.POL));
      var tone = Number(localStorage.getItem(localStorageKeys.TONE));
      var dsq = localStorage.getItem(localStorageKeys.DSQ);
      var slnbe = Number(localStorage.getItem(localStorageKeys.SLNBE));
      var url = new URL('http://' + ip + '/public');
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
      url.search = new URLSearchParams(params).toString();
      const response = await fetch(url);
      $("#status").html(" under process!");
  } catch (error) {
      console.error('Error: ' + error);
      var infoDisplay = new sendMessage(
          '#alert',
          'An error occurred during initSmartSNR: ' + error,
          true
      );
      infoDisplay.view();
      errorMessageHandler();
      localStorage.setItem(localStorageKeys.ERROR, 1);
  }
}


/** startEvents GET request. 
 * For example: // url: http://192.168.1.4/public?command=startEvents
**********************************************************************************************************************/

  async function startEvents() {
    try {
      var elem = document.getElementById("eventsBar");
      var c = 0;
      var width = 0;
      var ip = localStorage.getItem(localStorageKeys.IP);
      var url = new URL('http://' + ip + '/public');
      var params = {
        command: 'startEvents'
      };
      url.search = new URLSearchParams(params).toString();
      const response = await fetch(url);
      const reader = response.body.getReader();
      var text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // progress bar clean
          elem.style.width = "0%";
          //console.log("Stream complete");
          // set run 
          localStorage.setItem(localStorageKeys.RUN, 0);
          // data processing
          streamResponseHandler(text);
          // Show graph
          drawChart();
          // info data
          writeDataInfo();
          break;
        }
        // Event stream handling 
        text += new TextDecoder().decode(value);
        // response counter
        $("#countsEvent").html(parseInt(c++/16));
        // progress bar 
        width += 100/332; 
        elem.style.width = width + "%";
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Error handling
      var infoDisplay = new sendMessage(
        '#alert',
        'An error occurred during startEvents: ' + error,
        true
      );
      infoDisplay.view();
      errorMessageHandler();
      localStorage.setItem(localStorageKeys.ERROR, 1);
    }
  }

  function streamResponseHandler(text) {
    // In the event of a successful response
    // timestamp
    var timestamp = new Date().getTime();
    // Breakdown into lines - every 16th line (result per second approx. 333/16)
    var lines = text.trim().split('\n');
    // Creating objects
    var i = 0;
    var eventData = lines
      .filter((line, index) => index % 16 === 0 && line.includes('data:'))
      .map(line => {
        try {
          var data = JSON.parse(line.substring(line.indexOf('{')));
          data.timestamp = timestamp + i;
          i += 1000;
          return data;
        } catch (e) {
          $("#alert").html('Error processing data: ' + e);
          return null;
        }
      })
      .filter(item => item !== null);
    // Data handling (storage.js)
    addDataIndexedDB(eventData);
  }

  function errorMessageHandler() {
    $("#status").html('');
    $("#countsEvent").html('');
    var elem = document.getElementById("eventsBar");
    elem.style.width = "0%";
    localStorage.setItem(localStorageKeys.RUN, 0);
    localStorage.setItem(localStorageKeys.STOP, 1);
  }

/** ordering of fetch queries */
  async function reportSnr() {
    try {
      var infoDisplay = new sendMessage(
        "#success",
        "The request is being processed.",
        true
      );
      infoDisplay.view();
    
      // Manage time interval report 
      var setTime = localStorage.getItem(localStorageKeys.SET_TIME);
      if (setTime>0) {
        for (i=0; i<(3*setTime); i++) {
            var stop = localStorage.getItem(localStorageKeys.STOP);
            if (stop == 1) {
                localStorage.setItem(localStorageKeys.STOP, 0);
                break;
            }
            await initSmartSNR();
            await startEvents();
        }
      }else{
        await initSmartSNR();
        await startEvents();
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Error handling
      var infoDisplay = new sendMessage(
        '#alert',
        'An error occurred while reporting the data: ' + error,
        true
      );
      infoDisplay.view();
      errorMessageHandler();
      localStorage.setItem(localStorageKeys.ERROR, 1);
    } finally {
      var error = localStorage.getItem(localStorageKeys.ERROR);
      if (error==0) {
        // Manage messages
        var infoDisplay = new sendMessage(
          "#success",
          "The request has been completed.",
          true, null, 5000
        );
        infoDisplay.send();
        $("#countsEvent").html("Successful!");
        $("#status").html("OFF");
      } else {
        localStorage.setItem(localStorageKeys.ERROR, 0);
      }
    }
  }

/** Time interval report / measurement for a given time, 3 reports per minute  *******************************************/

  function timeIntervalReport() {
    var setTime = $("#setTime").val();
    localStorage.setItem(localStorageKeys.SET_TIME, setTime);
    if (setTime>0) {
      reportSnr();
    }else{
      var infoDisplay = new sendMessage(
          "#alert",
          "Set the value!",
          true, null, 5000
      );
      infoDisplay.send();
      localStorage.setItem(localStorageKeys.RUN, 0);
    }
  }

/** Stop initSmartSNR request:  
 * For example: //url: http://192.168.1.56/public?command=initSmartSNR&state=off
***************************************************************************************************************************/

  async function stopReport() {
    try {
      localStorage.setItem(localStorageKeys.STOP, 1);
      /* $("#countsEvent").html("");
      $("#status").html(""); */
      var ip = localStorage.getItem(localStorageKeys.IP);
      var url = new URL('http://' + ip + '/public');
      var params = {
        command: 'initSmartSNR',
        state: 'off'
      };
      url.search = new URLSearchParams(params).toString();
      const response = await fetch(url);
      // Manage messages
      $("#status").html("Stopped!");
      var infoDisplay = new sendMessage(
        '#success',
        'Process stopped by user.',
        true, null, 5000
      );
      infoDisplay.send();
    } catch (error) {
      console.error('Error: ' + error);
      var infoDisplay = new sendMessage(
        '#alert',
        'An error occurred while stopped stream: ' + error,
        true
      );
      infoDisplay.view();
      errorMessageHandler();
      localStorage.setItem(localStorageKeys.ERROR, 1);
    }
  }

/** Graph **************************************************************************************************/

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

  // draw graph
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

/** Other data ********************************************************************************************/

  function writeDataInfo() {
      
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
        }else{
            $("#alfa").html("");
            $("#beta").html("");
            $("#gamma").html("");
            $("#lock").html("");
            $("#lnb_current").html("");
            $("#fromdate").html(""); 
            $("#todate").html("");
            $("#length").html("");
        }
      }).catch(error => {
        console.error(error);
      });
  }

/** Get IDB all data *****************************************************************************************/

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

function isValidIP(ip) {
  // Regex pattern
  var ipPattern = /^(25[0-5]|2[0-4]\d|[01]?\d{1,2})(\.(25[0-5]|2[0-4]\d|[01]?\d{1,2})){3}$/;
  // We check the IP address using the pattern
  return ipPattern.test(ip);
}

function getFormValue(key){
  if (key == 'ip') {
    $("#"+key).change(function(){
      var p = $('#'+key).val();
      var ip_valid = isValidIP(p);
      var ip = (!ip_valid)?alert("Invalid IP: "+p+"!"):p;
      localStorage.setItem(key, ip);
    });
  }else{
    $("#"+key).change(function(){
      var p = $('#'+key).val();
      localStorage.setItem(key, p);
    });
  }
  var p = localStorage.getItem(key);
  $("#"+key).val(p);
}

/** After the page loads **************************************************************************************/

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

  // Time Interval / SNR Report
  $("#timeIntervalReport").click(function(){
    $("#alert").hide();
    $("#success").hide();
    var run = localStorage.getItem(localStorageKeys.RUN);
    if (run==0) {
      var infoDisplay = new sendMessage(
        "#success",
        "The request has started!",
        true
      );
      infoDisplay.view();
      localStorage.setItem(localStorageKeys.RUN, 1);
      localStorage.setItem(localStorageKeys.STOP, 0);
      timeIntervalReport();
    }else{
      var infoDisplay = new sendMessage(
        "#success",
        "It's running! Try again later!",
        true,null,5000
      );
      infoDisplay.send();
    }
  });
  
  // SNR Report
  $("#reportOnce").click(function(){
    $("#alert").hide();
    $("#success").hide();
    var run = localStorage.getItem(localStorageKeys.RUN);
    if (run==0) {
      var infoDisplay = new sendMessage(
        "#success",
        "The request has started!",
        true
      );
      infoDisplay.view();
      localStorage.setItem(localStorageKeys.RUN,1);
      localStorage.setItem(localStorageKeys.SET_TIME, 0);
      reportSnr();
    }else{
      var infoDisplay = new sendMessage(
        "#success",
        "It's running! Try again later!",
        true,null,5000
      );
      infoDisplay.send();
    }
  });

  // Stop SNR Report
  $("#stop").click(function(){
    var run = localStorage.getItem(localStorageKeys.RUN);
    if (run==1) {
        stopReport();
        var infoDisplay = new sendMessage(
            "#success",
            "The request has been stopped.",
            true,null,5000
        );
        infoDisplay.send();
    }else{
        var infoDisplay = new sendMessage(
            "#success",
            "There is no running report.",
            true,null,5000
        );
        infoDisplay.send();
    }
  });

  // Delete all data from indexedDB 
  $("#clearls").click(function(){
    if (!confirm("Are you sure you want to delete the data?", "")) return;
    // clearIDB function call
    clearIDB().then(message => {
        var infoDisplay = new sendMessage(
            "#success",
            message,
            true, null, 5000
        );
        infoDisplay.send(); // The content of the data storage has been successfully deleted
      }).catch(error => {
        var infoDisplay = new sendMessage(
            "#alert",
            error,
            true, null, 5000
        );
        infoDisplay.send();
        console.error(error);
      });
    drawChart();
    writeDataInfo();
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

  writeDataInfo();

});