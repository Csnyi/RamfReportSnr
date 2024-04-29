/** JSON read */

// check JSON
function checkLock(text) {
  const regex = /lock/gi; 
  return regex.test(text);
}

function validateJsonKey(jsonObj) {
  const requiredKeys = ["lock", "snr", "lm_snr", "alfa", "beta", "gamma", "lnb_current", "lnb_voltage", "psu_voltage", "timestamp"];

  for (let key of requiredKeys) {
      if (!(key in jsonObj)) {
          console.error("Missing required JSON key!");
          return false; 
      }
      if (typeof jsonObj[key] !== 'number') {
          if (requiredKeys.includes(key)) {
              console.error("Required JSON key of non-number type");
              return false;
          }
      }
  }
  return true; // Minden szükséges tag megtalálható és szám típusú
}

function checkJSONForm(response) {
  try {
      JSON.parse(response); 
      console.log('The file is valid JSON.');
      return true; 
  } catch (error) {
      console.error('The file is not valid JSON:', error.message);
      return false; 
  }
}

function readJson() {
    const [file] = document.getElementById('fileinput').files;
    const reader = new FileReader(); 
    if (file) {
        reader.readAsText(file);
    };
    var fileName = file.name;

    reader.addEventListener("load", () => {

        var response = reader.result;
        var jsonValid = checkJSONForm(response);
        var containsLock = checkLock(response);
        if (!containsLock || !jsonValid) {
            var err = "The selected "+ fileName +" file has an incorrect JSON for this.";
            var uzenet = new sendMessage("#success", null, false, err, 5000);
            uzenet.view();
            return;
        };
        var AllData = JSON.parse(response);
        var validJsonKeys = validateJsonKey(AllData[0]);
        if (!validJsonKeys) {
            var err = "The selected "+ fileName +" file has an incorrect JSON for this.";
            var uzenet = new sendMessage("#success", null, false, err, 5000);
            uzenet.view();
            return;
        };

        var alfa = getDataFromJson(AllData, "alfa", "°");
        var beta = getDataFromJson(AllData, "beta", "°");
        var gamma = getDataFromJson(AllData, "gamma", "°");
        var lock = getDataFromJson(AllData, "lock");
        var lockVal = [];
        for (let i in lock){
            var lockText = (lock[i] == 1) ? "locked" : "not locked";
            lockVal.push(lockText);
        };
        var lnb_current = getDataFromJson(AllData, "lnb_current", " mA");
        var lnb_voltage = getDataFromJson(AllData, "lnb_voltage");
        var psu_voltage = getDataFromJson(AllData, "psu_voltage");
        var snr = getDataFromJson(AllData, "snr");
        var lmsnr = getDataFromJson(AllData, "lm_snr");
        var timestamp = getDataFromJson(AllData, "timestamp");
        fromdate = new Date(timestamp[0]).toLocaleString();
        todate = new Date(timestamp[timestamp.length-1]).toLocaleString();

        viewFirstData(alfa, beta, gamma, lockVal, lnb_current);
        
        viewTimes(fromdate, todate);

        const dataSets = [alfa, beta, gamma, lockVal, lnb_current];
        const dataSet = dataSets.map(data => data.map((value, index) => [value, new Date(timestamp[index]).toLocaleString()]));

        initDataTables(dataSet);
      
        var measureLength = AllData.length;
        $("#length").html(measureLength);

        var plotdata1 = {
            yData1: snr,
            yData2: lmsnr,
            name1: 'SNR',
            name2: 'LM SNR',
            timestamp: timestamp
        };
        drawChartFromStorage("myPlot1", "Signal-to-noise ratio", plotdata1);

        var plotdata2 = {
            yData1: lnb_voltage,
            yData2: psu_voltage,
            name1: 'LNB Voltage',
            name2: 'PSU Voltage',
            timestamp: timestamp
        };
        drawChartFromStorage("myPlot2", "Voltages", plotdata2);

        $("#fileName").html(fileName);
        $("#fname").html(fileName);

        var text = `${fileName} processed!`;
        var uzenet = new sendMessage("#success", text, true, null, 5000);
        uzenet.send();

    }, false); 
};

/** load data */

  function viewFirstData(alfa, beta, gamma, lockVal, lnb_current) {
    $("#alfa_first").html(alfa[0]);
    $("#beta_first").html(beta[0]);
    $("#gamma_first").html(gamma[0]);
    $("#lock_first").html(lockVal[0]);
    $("#lnb_current_first").html(lnb_current[0]);
  }

  function viewTimes(fromdate, todate) {
    $("#fromdate").html(fromdate);
    $("#todate").html(todate);
  }

  var infoTables = [];

  function initDataTables(dataSet) {
    var tables = document.querySelectorAll(".datalist");
    for (let i = 0; i < infoTables.length; i++)  {
        if (infoTables[i]) {
          infoTables[i].destroy();
        } 
    }
    for (let i = 0; i < tables.length; i++) {
        var infoTable = $(tables[i]).DataTable({
            destroy: true,
            columns: [
                { title: 'Value:' },
                { title: 'Time:' }
            ],
            data: dataSet[i],
            retrieve: true
        });
        infoTables.push(infoTable);
    }
  }

/** Get data */

  function getDataFromJson(allData, key, sign=null){
    var data = [];
    for (let x in allData){
      if (!isNaN(allData[x][key])) {
        var oneData = Number(allData[x][key]);
        data.push(oneData+sign);
      }else{
        var oneData = "stopped";
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
        if (myFile) {
            var fileName = myFile.name;
            var fileExtension = fileName.split('.').pop().toLowerCase();
            if (fileExtension === 'json') {
                readJson(); 
            } else {
                var err = "The selected file has an incorrect extension.";
                var uzenet = new sendMessage("#success", null, false, err, 5000);
                uzenet.send();
            }
        } else {
            var err = "No JSON selected!";
            var uzenet = new sendMessage("#success", null, false, err, 5000);
            uzenet.send();
        }

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