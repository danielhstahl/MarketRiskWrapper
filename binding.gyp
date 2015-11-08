 {
  "targets": [
    {
      "target_name": "MarketRiskWrapper",
      "sources": [ "MarketRiskWrapper.cpp" ],
      "include_dirs":[
        "/home/daniel/Documents/cpp/MiscellaniousUtilities",
        "/home/daniel/Documents/cpp/NewtonOptimization",
        "/home/daniel/Documents/cpp/eigen",
        "/home/daniel/Documents/cpp/BinomialTree",
        "/home/daniel/Documents/cpp/marketRisk"
      ],
      "libraries": [
        "-lDate", "-L/home/daniel/Documents/cpp/MiscellaniousUtilities",
        "-lNewton", "-L/home/daniel/Documents/cpp/NewtonOptimization",
        "-lTree", "-L/home/daniel/Documents/cpp/BinomialTree",
        "-lVasicek", "-lYieldSpline", "-lBlackScholes", "-lMC", "-lSwap", "-lSpline", "-L/home/daniel/Documents/cpp/marketRisk",
        "-L/home/daniel/Documents/cpp/eigen"
      ],
      "cflags": [ "-std=c++11", "-fPIC" ]
    }
  ]
}
