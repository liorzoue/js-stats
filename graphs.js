"use strict";

/*
    Graphs
        
    v 0.1.20140520
        - [histogram] Put theorical curve on another axis
        
    v 0.1.20140513
        - write .histogram() function 
        
    v 0.1.20140505
        - Fix min/max
        
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
                {
                    title: o.title,
                    mouse: { track: true, relative: true }
                }
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
        o.nbIntervals   = (o.nbIntervals != undefined) ? o.nbIntervals : 10;
        o.title         =  o.title         ? o.title       : 'histogram'   ;
        o.container     =  o.container     ? o.container   : 'graphs'      ;
        
        var 
            container,
            graph,
            ctx     = this,
            
            d       = this.histo_values(o.nbIntervals),
            width   = d.width,
            d0      = [],
            d1      = [],
            d2      = [],
            
            y_max   = 0,
            
            ec      = this.stDev(),
            esp     = this.mean(),
            n       = this.count(),
            min     = this.core.normalStdInverse(this.core.percent_values[0]/100)*ec+esp,
            max     = this.core.normalStdInverse(this.core.percent_values[this.core.percent_values.length-1]/100)*ec+esp,
            usl     = this.USL(),
            lsl     = this.LSL(),
            ucl     = this.UCL(),
            lcl     = this.LCL(),
            
            range   = max-min,
            
            margin  = 0.05;
        
        /* Obtain container */
        container = document.getElementById(o.container);
        container.innerHTML = ''; /* empty inner html */
        
        /* group values into intervals */
        if (o.nbIntervals == 0) {
            var data = this.results.dataSorted.slice();
            
            d1.push([data[0], 1]);
            for (var i=1; i<n; i++) {
                var d1_len = d1.length;
                
                if (d1[d1.length-1][0] == data[i]) { d1[d1.length-1][1]++; }
                else { d1.push([data[i], 1]); }
            }
            
            width = 1;
            
            
            
        } else {
            for (var i=0; i<o.nbIntervals; i++) {
                var x = (d.intervals[i].max+d.intervals[i].min)/2;
                var y = d.intervals[i].n;
                
                y_max = (y>y_max) ? y : y_max;
                
                d1.push([x, y]);
            }
        }
        
        /* generate normal gaussian */
        for (var i=0; i<100; i++) {
            var x = min+i*range/100;
            var y = this.core.normale(x, esp, ec);
            
            y_max = (y>y_max) ? y : y_max;
            
            d2.push([x, y]);
        }
        
        /* Aggregate data */
        /* Bars */
        d0.push({ data: d1, bars:   { show: true, barWidth: width, shadowSize : 0 }, label: 'Data' });
        /* Theorical normal gaussian */
        d0.push({ data: d2, lines:  { show: true }, label: 'Theorical', yaxis:2 });
        
        /* Verticals lines */
        if (usl != undefined || lsl != undefined) {
            var l = d0.length;
            d0.push({ data: [], lines: { show: true }, label: 'Specification limits ('+this.core.round(lsl, 3)+', '+this.core.round(usl, 3)+')'});
            
            if (usl != undefined) {
                d0[l].data.push([usl, -1]); 
                d0[l].data.push([usl, y_max*1.2]);
                max = (usl > max) ? usl : max;
            }
            
            if (lsl != undefined) {
               d0[l].data.push([lsl, y_max*1.2]);
               d0[l].data.push([lsl, -1]);
               min = (lsl < min) ? lsl : min;
            }
        }
        
        if (ucl != undefined || lcl != undefined) {
            var l = d0.length;
            d0.push({ data: [], lines: { show: true }, label: 'Control limits ('+this.core.round(lcl, 3)+', '+this.core.round(ucl, 3)+')'});
            if (ucl != undefined) {
                d0[l].data.push([ucl, -1]); 
                d0[l].data.push([ucl, y_max*1.2]);
                max = (ucl > max) ? ucl : max;
            }
            
            if (lcl != undefined) {
                d0[l].data.push([lcl, y_max*1.2]);
                d0[l].data.push([lcl, -1]);
                min = (lcl < min) ? lcl : min;
            }
        }
        
        min -= (1+margin)*range;
        max += (1+margin)*range;
        
        /* Draw graph with Flotr */
        try {
            graph = Flotr.draw(
                container,
                d0,
                {
                    title: o.title,
                    yaxis: { min: 0, max: y_max*1.1 },
                    mouse: {
                        track : true,
                        relative : true,
                        trackDecimals: 3,
                        trackFormatter: function (obj) {
                            var x = parseFloat(obj.x);
                            return '['+ctx.core.round(x - width/2, 2)+', '+ctx.core.round(x + width/2, 2)+'] ' + parseInt(obj.y, 10); 
                        }
                    },
                    xaxis: { min: ((o.min != undefined) ? o.min : min), max: max }
                }
            );
        } catch (e) {
            console.warn(e);
            container.innerHTML = '<div class="alert alert-danger"><strong>Erreur</strong> '+e.message+'</div>';
        }
    },
    
    evolution: function (o) {
        /* Define object o if undefined */
        o ? o : {};
        
        /* Default values for options */
        o.title         = o.title         ? o.title       : 'evolution in time' ;
        o.container     = o.container     ? o.container   : 'graphs' ;
        
        var 
            container = document.getElementById(o.container),
            graph,
            ctx     = this,
            d       = this.data(),
            n       = this.count(),
            
            d0      = [],
            d1      = [],
            
            ucl     = this.UCL(),
            lcl     = this.LCL(),
            usl     = this.USL(),
            lsl     = this.LSL(),
            
            ymin    = this.min(),
            ymax    = this.max(),
            
            mean    = this.mean(),
            
            range   = this.range(),
            margin  = .05;
            
        for (var i=0; i<n; i++) {
            d1.push([i, d[i]]);
        }
        
        /* Data */
        d0.push({ data: d1, line: { show: true }, label: 'Data' });
        /* Mean */
        d0.push({ data: [[-1, mean], [n+1, mean]], line: { show: true }, shadowSize : 0, label: 'Mean ('+this.core.round(mean, 3)+')' });
        
        /* CL */
        d0.push({ data: [[-1, usl], [n+1, usl],  [n+1, lsl],  [-1, lsl]], line: { show: true }, shadowSize : 0, label: 'Specification limits ('+this.core.round(lsl, 3)+', '+this.core.round(usl, 3)+')' });
        d0.push({ data: [[-1, ucl], [n+1, ucl],  [n+1, lcl],  [-1, lcl]], line: { show: true }, shadowSize : 0, label: 'Control limits ('+this.core.round(lcl, 3)+', '+this.core.round(ucl, 3)+')' });
        
        ymin = (lsl < ymin) ? lsl : ymin;
        ymin = (lcl < ymin) ? lcl : ymin;
        ymin -= (1+margin)*range;
        
        ymax = (usl > ymax) ? usl : ymax;
        ymax = (ucl > ymax) ? ucl : ymax;
        ymax += (1+margin)*range;
        
        
        graph = Flotr.draw(
            container, d0,
            {
                title: o.title,
                mouse: {
                    track: true,
                    relative: true,
                    sensibility: 200,
                    trackFormatter: function (obj) {
                        return ctx.core.round(ctx.data()[parseInt(obj.x, 10)], 3); 
                    }
                },
                xaxis: { min: 0,      max: n-1       },
                yaxis: { min: ymin,   max: ymax      }
            }
        );
    }
});
