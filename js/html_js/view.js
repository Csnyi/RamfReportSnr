/** JSON read */

function readJson() {
    const [file] = document.getElementById('fileinput').files;
    const reader = new FileReader(); 
    if (file) {
        reader.readAsText(file);
    };

    reader.addEventListener("load", () => {

        var response = reader.result;
        var AllData = JSON.parse(response);
        
        var alfa = getDataFromJson(AllData, "alfa");
        var beta = getDataFromJson(AllData, "beta");
        var gamma = getDataFromJson(AllData, "gamma");
        var lock = getDataFromJson(AllData, "lock");
        var lockVal = [];
        for (let i in lock){
            var lockText = (lock[i] == 0) ? "not locked" : "locked";
            lockVal.push(lockText);
        };
        var lnb_current = getDataFromJson(AllData, "lnb_current");
        var lnb_voltage = getDataFromJson(AllData, "lnb_voltage");
        var psu_voltage = getDataFromJson(AllData, "psu_voltage");
        var snr = getDataFromJson(AllData, "snr");
        var lmsnr = getDataFromJson(AllData, "lm_snr");
        var timestamp = getDataFromJson(AllData, "timestamp");
        fromdate = new Date(timestamp[0]).toLocaleString();
        todate = new Date(timestamp[timestamp.length-1]).toLocaleString();

        viewFirstData(alfa, beta, gamma, lock, lnb_current, fromdate, todate);
        
        viewAllData(alfa, beta, gamma, lockVal, lnb_current, fromdate, todate, timestamp);

        initDataTables();
                
        var measureLength = AllData.length;
        $("#length").html(measureLength);

        var plotdata1 = {
            yData1: snr,
            yData2: lmsnr,
            name1: 'SNR',
            name2: 'LM SNR',
            timestamp: timestamp
        };
        drawChartFromStorage("myPlot1", "Signal-to-noise ratio", plotdata1)

        var plotdata2 = {
            yData1: lnb_voltage,
            yData2: psu_voltage,
            name1: 'LNB Voltage',
            name2: 'PSU Voltage',
            timestamp: timestamp
        };
        drawChartFromStorage("myPlot2", "Voltages", plotdata2)
    }, false); 
};

/** load data */

  function viewSelect(data, text, timestamp){
    var dataHtml = "";
    for (let x =0; x<data.length;  x++){
        var dataVal = data[x] + text ;
        var atTime = new Date(timestamp[x]).toLocaleString();
        dataHtml += "<tr><td>"+dataVal+"</td><td>"+atTime+"</td></tr>";
    };
    return dataHtml;
  };

  function viewFirstData(alfa, beta, gamma, lock, lnb_current, fromdate, todate) {
    $("#alfa_first").html(alfa[0]+ "°");
    $("#beta_first").html(beta[0]+ "°");
    $("#gamma_first").html(gamma[0]+ "°");
    var lockVal = (lock[0] == 0) ? "not locked" : "locked" ;
    $("#lock_first").html(lockVal);
    $("#lnb_current_first").html(lnb_current[0] + " mA");
    $("#fromdate_first").html(fromdate);
    $("#todate_first").html(todate);
  }

  function viewAllData(alfa, beta, gamma, lock, lnb_current, fromdate, todate, timestamp) {
    var alfaHtml = viewSelect(alfa, "°", timestamp);
    $("#alfa").html(alfaHtml);
    var betaHtml = viewSelect(beta, "°", timestamp);
    $("#beta").html(betaHtml);
    var gammaHtml = viewSelect(gamma, "°", timestamp);
    $("#gamma").html(gammaHtml);
    var lockHtml = viewSelect(lock, "", timestamp);
    $("#lock").html(lockHtml);
    var lnb_currentHtml = viewSelect(lnb_current, " mA", timestamp);
    $("#lnb_current").html(lnb_currentHtml);
    $("#fromdate").html(fromdate);
    $("#todate").html(todate);
  }

  function initDataTables() {
    var tables = document.querySelectorAll(".datalist");
    for (let i = 0; i < tables.length; i++) {
        $(tables[i]).DataTable();
    }
  }

/** Get data */

  function getDataFromJson(allData, key){
    var data = [];
    for (let x in allData){
      if (!isNaN(allData[x][key])) {
        var oneData = Number(allData[x][key]);
        data.push(oneData);
      }
    }
    return data;
  }

/** After loading the page */

$(function () {
    
    $("#alert").click(function(){
      $("#alert").hide('slow');
    });
  
    $("#success").click(function(){
      $("#success").hide('slow');
    });

    $("#fileinput").change(function () {

        var myFile = $('#fileinput').prop('files')[0];
        /* if (myFile) { */
            var fileName = myFile.name;
            var fileExtension = fileName.split('.').pop().toLowerCase();
            if (fileExtension === 'json') {
                readJson(); 
                $("#fileName").html(fileName);
                $("#fname").html(fileName);
                var text = `${fileName} processed!`;
                var uzenet = new sendMessage("#success", text, true, null, 5000);
                uzenet.send();
            } else {
                var err = "The selected file has an incorrect extension.";
                var uzenet = new sendMessage("#success", null, false, err, 5000);
                uzenet.send();
            }
        /* } else {
            var err = "No JSON selected!";
            var uzenet = new sendMessage("#success", null, false, err, 5000);
            uzenet.send();
        } */

    });

    $("#load").click(function () {
        window.close();
        if (window.opener) {
          window.opener.focus();
        } else {
          window.location.href = document.referrer;
        }
    });

    drawChartFromStorage("myPlot1", "Signal-to-noise ratio");

    drawChartFromStorage("myPlot2", "Voltages");

});