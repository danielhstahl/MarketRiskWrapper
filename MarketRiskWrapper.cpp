#include <node.h>
#include <iostream>
#include <string>
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"
#include "Vasicek.h"
#include "YieldSpline.h"
#include "MarketData.h"
#include "Date.h"
#include "MC.h"
#include "SimulNorm.h"
#include "ComputePortfolio.h"
using v8::FunctionCallbackInfo;
using v8::Exception;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

typedef Vasicek<YieldSpline> VasicekEngine;

void Method(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
//args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world"));
  if (args.Length() != 3) {
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate, "Requires exactly three arguments")));
    return;
  }

  if (!args[0]->IsString()||!args[1]->IsString()|!args[2]->IsString()) {
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate, "Requires String")));
    return;
  }

  std::string jsonYield(*v8::String::Utf8Value(args[0]->ToString()));
  std::string jsonHistorical(*v8::String::Utf8Value(args[1]->ToString()));
  std::string jsonPortfolio(*v8::String::Utf8Value(args[2]->ToString()));
  //const char* json=*v8::String::Utf8Value();
  rapidjson::Document dYield;
  rapidjson::Document dHistorical;
  rapidjson::Document dPortfolio;
  dYield.Parse(jsonYield.c_str());
  dHistorical.Parse(jsonHistorical.c_str());
  dPortfolio.Parse(jsonPortfolio.c_str());
  int n=dYield.Size();
  int m=dHistorical["observations"].Size();
  int sizePortfolio=dPortfolio.Size();
  //Deal with yield
  std::vector<SpotValue> yield;
  Date dt;//current date
  dt.setScale("day");
  for(int i=0; i<n; ++i){
    yield.push_back(SpotValue(dt+dYield[i]["daysPlus"].GetInt(), std::stod(dYield[i]["value"].GetString())*.01));
  }
  YieldSpline spl(yield);
  //std::cout<<"test"<<spl.Yield(20)<<std::endl;
  //end deal with yield
  //Deal with historical
  std::vector<SpotValue> historical;
  std::string val;
  for(int i=0; i<m; ++i){
    val=dHistorical["observations"][i]["value"].GetString();
    if(val!="."){//nulls show up as "."
      historical.push_back(SpotValue(dHistorical["observations"][i]["date"].GetString(), std::stod(dHistorical["observations"][i]["value"].GetString())*.01));
    }
  }
  //end deal with historical
  //Deal with portfolio
  //std::cout<<"This is first string date: "<<dPortfolio[0]["maturity"].GetString()<<std::endl;
  //Date date1=Date("2017-11-05");
  //Date date2=Date("2014-10-02");
  //std::cout<<date1<<std::endl;
  //std::cout<<date2<<std::endl;
  std::vector<AssetFeatures> portfolio;
  for(int i=0; i<sizePortfolio; ++i){
    /*Date Maturity;
    Date UnderlyingMaturity;
    double Strike;
    double Tenor;
    std::string type;*/
    if(strcmp(dPortfolio[i]["type"].GetString(), "bond")==0){
      //newAsset.Maturity=Date(dPortfolio[i]["maturity"].GetString());
      //newAsset.type="bond";
      portfolio.push_back({
        Date(dPortfolio[i]["maturity"].GetString()),
        Date(dPortfolio[i]["maturity"].GetString()),
        0,
        0,
        "bond"
      });
      //portfolio.back().Maturity=Date(dPortfolio[i]["maturity"].GetString());
      //portfolio.back().type="bond";
    }
    else if(strcmp(dPortfolio[i]["type"].GetString(), "caplet")==0){
      portfolio.push_back({
        Date(dPortfolio[i]["maturity"].GetString()),
        Date(dPortfolio[i]["maturity"].GetString()),
        dPortfolio[i]["strike"].GetDouble(),
        dPortfolio[i]["tenor"].GetDouble(),
        "caplet"
      });
      /*portfolio.push_back(AssetFeatures());
      portfolio.back().Maturity=Date(dPortfolio[i]["maturity"].GetString());
      portfolio.back().type="caplet";
      portfolio.back().Strike=dPortfolio[i]["strike"].GetDouble();
      portfolio.back().Tenor=dPortfolio[i]["tenor"].GetDouble();*/
      //portfolio.push_back(AssetFeatures(dPortfolio[i]["maturity"].GetString(), dPortfolio[i]["strike"].GetDouble(), dPortfolio[i]["tenor"].GetDouble(), "caplet"));
    }
    else if(strcmp(dPortfolio[i]["type"].GetString(), "swaption")==0){
      portfolio.push_back({
        Date(dPortfolio[i]["maturity"].GetString()),
        Date(dPortfolio[i]["underlyingMaturity"].GetString()),
        dPortfolio[i]["strike"].GetDouble(),
        dPortfolio[i]["tenor"].GetDouble(),
        "swaption"
      });
      //portfolio.push_back(AssetFeatures(dPortfolio[i]["maturity"].GetString(), dPortfolio[i]["strike"].GetDouble(), dPortfolio[i]["tenor"].GetDouble(),dPortfolio[i]["underlyingMaturity"].GetString(), "swaption"));
    }
    else if(strcmp(dPortfolio[i]["type"].GetString(), "call")==0){
      portfolio.push_back({
        Date(dPortfolio[i]["maturity"].GetString()),
        Date(dPortfolio[i]["underlyingMaturity"].GetString()),
        dPortfolio[i]["strike"].GetDouble(),
        0,
        "call"
      });
    //  portfolio.push_back(AssetFeatures(dPortfolio[i]["maturity"].GetString(), dPortfolio[i]["strike"].GetDouble(), dPortfolio[i]["underlyingMaturity"].GetString(), "call"));
    }

    //std::cout<<dPortfolio[i]["maturity"].GetString()<<std::endl;
    //std::cout<<portfolio[0].Maturity<<std::endl;
  }
  //std::cout<<portfolio[0].type<<std::endl;
  //std::cout<<portfolio[2000].type<<std::endl;
  //end deal with portfolio

  double a=.4;
  double sig=.02;
  double r0=.03;
  VasicekEngine vsk(spl, a, sig, r0);
  vsk.findHistoricalB(historical);

  SimulNorm simul;
  ComputePortfolio<VasicekEngine> myPortfolio(&vsk, portfolio);
  myPortfolio.setDates(10); //ten day VaR

  //std::cout<<"bond call: "<<vsk.Bond_Call(.0238855, .02777778, .99, .35, .1)<<std::endl;

  MC mc(1000);//1000 simulations

  auto start = std::chrono::system_clock::now();
  mc.simulateDistribution([&](){
    //std::unordered_map<double, double> path=vsk.simulate(simul);
    return myPortfolio.execute(vsk.simulate(simul));//simulates path and computes portfolio value along the path
  });
  auto end=std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now()-start);
	std::cout<<"Time it took: "<<end.count()/1000.0<<std::endl;


  std::string valToReturn("{VaR:");
  valToReturn+=std::to_string(mc.getVaR(.99));
  valToReturn+=", Error:";
  valToReturn+=std::to_string(mc.getError());
  valToReturn+="}";
  std::cout<<"This is VaR: "<<mc.getVaR(.99)<<std::endl;
  std::cout<<"This is estimate: "<<mc.getEstimate()<<std::endl;
  std::cout<<"This is error: "<<mc.getError()<<std::endl;
  //std::cout<<"bond call: "<<vsk.Bond_Call(.0238855, .02777778, .99, .35, .1)<<std::endl;
  //std::cout<<std::to_string(mc.getVaR(.99))<<std::endl;
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, valToReturn.c_str()));
}

void init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "MarketRiskWrapper", Method);
}

NODE_MODULE(MarketRiskWrapper, init)
