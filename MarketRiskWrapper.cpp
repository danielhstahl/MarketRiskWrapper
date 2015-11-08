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
using v8::FunctionCallbackInfo;
using v8::Exception;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void Method(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
//args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world"));
  if (args.Length() != 2) {
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate, "Requires exactly two arguments")));
    return;
  }

  if (!args[0]->IsString()||!args[1]->IsString()) {
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate, "Requires String")));
    return;
  }

  std::string jsonYield(*v8::String::Utf8Value(args[0]->ToString()));
  std::string jsonHistorical(*v8::String::Utf8Value(args[1]->ToString()));
  //const char* json=*v8::String::Utf8Value();
  rapidjson::Document dYield;
  rapidjson::Document dHistorical;
  dYield.Parse(jsonYield.c_str());
  dHistorical.Parse(jsonHistorical.c_str());
  int n=dYield.Size();
  int m=dHistorical["observations"].Size();
  //Deal with yield
  std::vector<SpotValue> yield;

  Date dt;//current date
  dt.setScale("day");
  for(int i=0; i<n; ++i){
    yield.push_back(SpotValue(dt+dYield[i]["daysPlus"].GetInt(), std::stod(dYield[i]["value"].GetString())*.01));
  }
  YieldSpline spl(yield);
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
  double a=.4;
  double sig=.02;
  double r0=.03;
  double delt=0;
  Vasicek<YieldSpline> vsk(spl, a, sig, r0);
  vsk.findHistoricalB(historical);

}

void init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "MarketRiskWrapper", Method);
}

NODE_MODULE(MarketRiskWrapper, init)
