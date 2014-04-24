"use strict";

/***
 *
 * Base class
 *
 */
if (!Class) {
    var Class = function() {
        this.initialize && this.initialize.apply(this, arguments);
    };
}

if (!Class.extend) {
    Class.extend = function(childPrototype) {
        var parent = this;
        var child = function() { return parent.apply(this, arguments); };
        child.extend = parent.extend;
        var Surrogate = function() {};
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate;
        for(var key in childPrototype){ child.prototype[key] = childPrototype[key]; }
        return child;
    };
}

if (!nv) { console.warn('graphs.js need nv.d3.js (https://github.com/novus/nvd3)'); }

var graphs = Class.extend({
    probability: function (o) {
        function sinAndCos() {
            var cos = [];

            for (var i = 0; i < 100; i++) {
                cos.push({x: i, y: 1 * Math.cos(i/10)});
            }

            return [
                {
                    values: cos,
                    key: "Cosine Wave",
                    color: "#2ca02c"
                }
            ];
        }
        
        nv.addGraph(function() {
            var chart = nv.models.scatterChart()
                .showDistX(true)
                .showDistY(true).options({
                margin: {left: 90, bottom: 50},
                showXAxis: true,
                showYAxis: true,
                showDistX: true, 
                transitionDuration: 250
            });

            chart.xAxis
                .axisLabel("Données")
                .tickFormat(d3.format(',.4f'));
                
            chart.yAxis
                .axisLabel('Pourcentage')
                .tickFormat(d3.format(',.1f'));

            //chart.yScale(d3.scale.pow().exponent(.25));
            
            d3.select(o.selector)
                .datum(o.data)
                .call(chart);

            nv.utils.windowResize(chart.update);

            //chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });

            return chart;
        });
    }
});
