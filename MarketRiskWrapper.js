https=require('https');
var mrkRisk=require('./build/Release/MarketRiskWrapper');
//TODO: adjust the swap rate curve so that it reflects the actual zero coupon curve
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



var portfolio=[];
var YieldCurveUnExtrapolated=Array(apiStrings.length);
var historicalResults="";
var retreivedHistoricalResults=false;
var retreivedYieldResults=false;
var retreivedPortfolio=false;
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
  if(retreivedYieldResults&&retreivedHistoricalResults&&retreivedPortfolio){
    var result=mrkRisk.MarketRiskWrapper(JSON.stringify(YieldCurveUnExtrapolated), historicalResults, JSON.stringify(portfolio));
    console.log(result);
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
var getPortfolio=function(numAssets){
  var currdate=new Date();
  Date.prototype.addDays = function(days){
      var dat = new Date(this.valueOf());
      dat.setDate(dat.getDate() + days);
      return dat;
  }
  Date.prototype.yyyymmdd = function() {
     var yyyy = this.getFullYear().toString();
     var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
     var dd  = this.getDate().toString();
     return yyyy + "-"+(mm[1]?mm:"0"+mm[0])+ "-" + (dd[1]?dd:"0"+dd[0]); // padding
  };
  //console.log(currdate.addDays(1).yyyymmdd());
  for(var i=0; i<numAssets/4; i++){ //create a fake portfolio
    portfolio.push({maturity:currdate.addDays(i+1).yyyymmdd(), type:"bond"});
  }
  for(var i=0; i<numAssets/4; i++){ //create a fake portfolio
    portfolio.push({maturity:currdate.addDays(i+1).yyyymmdd(), strike:.03, tenor:.25, type:"caplet"});
  }
  for(var i=0; i<numAssets/4; i++){ //create a fake portfolio
    portfolio.push({maturity:currdate.addDays(i+1).yyyymmdd(), strike:.03, tenor:.25, underlyingMaturity:currdate.addDays(i+721).yyyymmdd(), type:"swaption"});
  }
  for(var i=0; i<numAssets/4; i++){ //create a fake portfolio
    portfolio.push({maturity:currdate.addDays(i+1).yyyymmdd(), strike:.99, underlyingMaturity:currdate.addDays(i+91).yyyymmdd(), type:"call"});
  }
  retreivedPortfolio=true;
}
runFunc(apiStrings, 0);
https.get("https://api.stlouisfed.org/fred/series/observations?series_id=USD1WKD156N&api_key=6b75e4bc06a6ed991a7a9cc64d70c3fa&file_type=json", callback); //1 week libor history
getPortfolio(3000);
