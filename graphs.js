"use strict";

/*
    Graphs
    
    v 0.1.20140428
        - First version
        - Extend stats.js
        - Draw statisticals graphs
            * Probability diagram
            * Histogram
*/
var graphs = stats.extend({
    
    diagram: function (o) {
        /*
         * Draw probability diagram
         */
         
        /**
         * Default option values :
         * {
         *      title:       'histogram',
         *      container:   'graphs'
         * }
         *
         * Adjustement chart is calculate on 100 values
         **/
        
        /* Define object o if undefined */
        o ? o : {};
        
        /* Default values for options */
        o.title         = o.title         ? o.title       : 'probability diagram'   ;
        o.container     = o.container     ? o.container   : 'graphs'                ;
        
        var d    = this.results.dataSorted.slice(),
            p    = this.prob_values(),
            n    = this.results.count,
            ec   = this.stDev(),
            esp  = this.mean(),
            
            d0   = [],
            d1   = [],
            
            graph,
            container = document.getElementById(o.container);
            
        container.innerHTML = ''; /* empty inner html */

        /* Place values on graph */
        for (var i=0; i<n; i++) {
            var x = d[i];
            var y = this.core.normalStdInverse(p.values[i]);
            
            d0.push([x, y]);
        }
        
        
        n = this.core.percent_values.length;
        
        /* Theorical values */
        for (var i = 0; i<n; i++) {
            var x = this.core.normalStdInverse(this.core.percent_values[i]/100)*ec+esp;
            var y = this.core.normalStdInverse(this.core.percent_values[i]/100);
            
            d1.push([x, y]);
        }
        
        /* Draw graph with Flotr */
        try {
            graph = Flotr.draw(
                container, [ 
                    { data : d1 },
                    { data: d0,   points: { show: true,  shadowSize : 0 } }, 
                ],
                { title: o.title, mouse:  { track: true, relative: true } }
            );
        } catch (e) {
            console.warn(e);
            container.innerHTML = '<div class="alert alert-danger"><strong>Erreur</strong> '+e.message+'</div>';
        }
    },
    
    histogram: function (o) {
        /*
         * Draw histogram
         * 
         * Use a histogram to visualize distribution of data
         */
         
        /**
         * Default option values :
         * {
         *      nbIntervals: 10,
         *      title:       'histogram',
         *      container:   'graphs'
         * }
         *
         * Adjustement chart is calculate on 100 values
         **/
        
        /* Define object o if undefined */
        o ? o : {};
        
        /* Default values for options */
        o.nbIntervals   = o.nbIntervals   ? o.nbIntervals : 10            ;
        o.title         = o.title         ? o.title       : 'histogram'   ;
        o.container     = o.container     ? o.container   : 'graphs'      ;
        
        var 
            container,
            graph,
            d       = this.histo_values(o.nbIntervals),
            width   = d.width,
            d1      = [],
            d2      = [],
            
            ec      = this.stDev(),
            esp     = this.mean(),
            n       = this.results.count,
            min     = this.core.normalStdInverse(this.core.percent_values[0]/100)*ec+esp,
            max     = this.core.normalStdInverse(this.core.percent_values[this.core.percent_values.length-1]/100)*ec+esp,
            range   = max-min;
        
        /* Obtain container */
        container = document.getElementById(o.container);
        container.innerHTML = ''; /* empty inner html */
        
        /* group values into intervals */
        for (var i=0; i<o.nbIntervals; i++) {
            var x = (d.intervals[i].max+d.intervals[i].min)/2;
            var y = d.intervals[i].n;
            
            d1.push([x, y]);
        }
        
        /* generate normal gaussian */
        for (var i=0; i<100; i++) {
            var x = min+i*range/100;
            var y = ec*(n/2)*this.core.normale(x, esp, ec);
            
            d2.push([x, y]);
        }
        
        /* Draw graph with Flotr */
        try {
            graph = Flotr.draw(
                container,
                [
                    { data: d1, bars:   { show: true, barWidth: width, shadowSize : 0 } },
                    { data: d2, lines:  { show: true }                                  }
                ],
                {
                    title: o.title,
                    yaxis: { min: 0,        autoscaleMargin: 1  },
                    mouse: { track : true,  relative : true     },
                    xaxis: { min: min,      max: max            }
                }
            );
        } catch (e) {
            console.warn(e);
            container.innerHTML = '<div class="alert alert-danger"><strong>Erreur</strong> '+e.message+'</div>';
        }
    }
});
