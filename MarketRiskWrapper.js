https=require('https');
var mrkRisk=require('../../cpp/NodeWrapper/build/Release/MarketRiskWrapper');
apiStrings=[
  {
    description:"Most Current 1 month LIBOR",
    url:"https://api.stlouisfed.org/fred/series/observations?series_id=USD1MTD156N&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1",
    daysPlus:30//thirty day convention
  },
  {
    description:"Most Current 3 month LIBOR",
    url:"https://api.stlouisfed.org/fred/series/observations?series_id=USD3MTD156N&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1",
    daysPlus:90
  },
  {
    description:"Most Current 6 month LIBOR",
    url:"https://api.stlouisfed.org/fred/series/observations?series_id=USD6MTD156N&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1",
    daysPlus:180
  },
  {
    description:"Most Current 12 month LIBOR",
    url:"https://api.stlouisfed.org/fred/series/observations?series_id=USD12MD156N&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1",
    daysPlus:360
  },
  {
    description:"Most Current 2 year swap on 3 month LIBOR",
    url:"https://api.stlouisfed.org/fred/series/observations?series_id=DSWP2&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1",
    daysPlus:720
  },
  {
    description:"Most Current 3 year swap on 3 month LIBOR",
    url:"https://api.stlouisfed.org/fred/series/observations?series_id=DSWP3&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1",
    daysPlus:1080
  },
  {
    description:"Most Current 4 year swap on 3 month LIBOR",
    url:"https://api.stlouisfed.org/fred/series/observations?series_id=DSWP4&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1",
    daysPlus:1440
  },
  {
    description:"Most Current 5 year swap on 3 month LIBOR",
    url:"https://api.stlouisfed.org/fred/series/observations?series_id=DSWP5&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1",
    daysPlus:1800
  },
  {
    description:"Most Current 7 year swap on 3 month LIBOR",
    url:"https://api.stlouisfed.org/fred/series/observations?series_id=DSWP7&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1",
    daysPlus:2520
  },
  {
    description:"Most Current 10 year swap on 3 month LIBOR",
    url:"https://api.stlouisfed.org/fred/series/observations?series_id=DSWP10&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1",
    daysPlus:3600
  },
  {
    description:"Most Current 30 year swap on 3 month LIBOR",
    url:"https://api.stlouisfed.org/fred/series/observations?series_id=DSWP30&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1",
    daysPlus:10800
  }
];

var YieldCurveUnExtrapolated=Array(apiStrings.length);
var historicalResults="";
var retreivedHistoricalResults=false;
var retreivedYieldResults=false;
var j={"j":0};

var callback = function(response) {
  var str = '';
  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    historicalResults += chunk;
  });
  //the whole response has been recieved
  response.on('end', function () {
    retreivedHistoricalResults=true;
    sendDataToCPP();
  });
}
var clb=function(response, i, n, jObj, desc, daysPlus){
  var str = '';
  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
  });
  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
    var obj=JSON.parse(str);

    YieldCurveUnExtrapolated[i]={date:obj.observations[0].date, value:obj.observations[0].value, description:desc, daysPlus:daysPlus};
    jObj.j++;
    //console.log(jObj.j);
    if(n==jObj.j){
      retreivedYieldResults=true;
      sendDataToCPP();
    }
  });
}
function sendDataToCPP(){
  if(retreivedYieldResults&&retreivedHistoricalResults){
    mrkRisk.MarketRiskWrapper(JSON.stringify(YieldCurveUnExtrapolated), historicalResults);
  }
}
var runFunc=function(arrayUrl, i){
  var n=arrayUrl.length;
  if(i<n){
    https.get(arrayUrl[i].url, function(response){
      clb(response, i, n, j, arrayUrl[i].description, arrayUrl[i].daysPlus);
    });
    runFunc(arrayUrl, i+1);
  }
}
runFunc(apiStrings, 0);
https.get("https://api.stlouisfed.org/fred/series/observations?series_id=USD1WKD156N&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json", callback); //1 week libor history
//process.stdin.resume();

//https.get("https://api.stlouisfed.org/fred/series/observations?series_id=USD1MTD156N&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1", clb); //most current 1 month LIBOR
//https.get("https://api.stlouisfed.org/fred/series/observations?series_id=USD3MTD156N&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1", clb); //most current 3 month LIBOR
//https.get("https://api.stlouisfed.org/fred/series/observations?series_id=USD6MTD156N&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1", clb); //most current 6 month LIBOR
//https.get("https://api.stlouisfed.org/fred/series/observations?series_id=USD12MD156N&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1", clb); //most current 12 month LIBOR
//https.get("https://api.stlouisfed.org/fred/series/observations?series_id=DSWP2&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1", clb); //most current 2 year swap on 3 month LIBOR
//https.get("https://api.stlouisfed.org/fred/series/observations?series_id=DSWP3&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1", clb); //most current 3 year swap on 3 month LIBOR
//https.get("https://api.stlouisfed.org/fred/series/observations?series_id=DSWP4&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1", clb); //most current 4 year swap on 3 month LIBOR
//https.get("https://api.stlouisfed.org/fred/series/observations?series_id=DSWP5&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1", clb); //most current 5 year swap on 3 month LIBOR
//https.get("https://api.stlouisfed.org/fred/series/observations?series_id=DSWP7&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1", clb); //most current 7 year swap on 3 month LIBOR
//https.get("https://api.stlouisfed.org/fred/series/observations?series_id=DSWP10&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1", clb); //most current 10 year swap on 3 month LIBOR
//https.get("https://api.stlouisfed.org/fred/series/observations?series_id=DSWP30&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json&sort_order=desc&limit=1", clb); //most current 30 year swap on 3 month LIBOR
//console.log(YieldCurveUnExtrapolated);
