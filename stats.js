"use strict";

/***
 * Stats.js
 * --- 
 * Statistical library written in JS
 * 
 * Tested on : Chrome 30+, Safari 7, IE8
 *
 * Author : E. Liorzou (github.com/liorzoue)
 * Licence : GNU
 * 
 * Changelog :
 * 
 * v 0.1.20140429-1
 *      - improvements in constructor
 *      - add stats.data() access to data
 *      - add process limits (no history)
 *          * setSpecificationLimit
 *          * setUSL
 *          * setLSL
 *      - add meanDifference
 *          * values for groups of 2
 *          * Mean (EMMean)
 *          * Median (EMMedian)
 *      - add Capability values
 *          * Cp
 *          * Pp
 *          * CPU
 *          * PPU
 *          * CPL
 *          * PPL
 *          * Cpk
 *          * Ppk
 *          * UCL (2 methods)
 *          * LCL (2 methods)
 * 
 * v 0.1.20140429
 *      - update licence
 *      - update "tested on"
 * 
 * v 0.1.20140428
 *      - First changelog ;)
 *      - Features at this state :
 *          * browser : detect browser user agent
 *          * core :
 *              Constants
 *              percent values
 *              sort numbers
 *              round number
 *              sign
 *              is a number pair
 *              truncate number
 *              normal law
 *              cdf (cumulative normal law)
 *              inverse normal law
 *          * populate: populate data array
 *          * setConfidenceProbability: Set probability for confidence interval (.95 by default)
 *          * setQuantiles: {
 *                  nb: nb of quantiles,
 *                  method: calc method (1 (default)|2|3)
 *                  withExtremities: (true|false) add or not quantiles at extremities
 *              }
 *          * count: nb of data values
 *          * min: min value of dataset
 *          * max: max value of dataset
 *          * range: max value minus min value
 *          * sum
 *          * mean
 *          * trMean: mean of dataset without the 5% top and 5% bottom values
 *          * median
 *          * variance
 *          * quantile
 *          * Q1: 1st Quartile
 *          * Q3: 3rd Quartile
 *          * IQR: Q3-Q1
 *          * stDev: Standart deviation
 *          * SEMean: Standard error of the mean
 *          * coefVar: Coefficient of variation
 *          * Anderson_Darling: Coefficient for normality test
 *          * p_value
 *          * prob_values: calculate values for diagram
 *              4 methods : 'benard', 'herd-johnson', 'hazen', 'kaplan-meier'
 *          * histo_values: group values by intervals
 *          * inverf: error function inverse
 *          * quantile025normal
 *          * confidence_interval
 *          * cp
 *          * cpk
 *          * LCI
 *          * LCS
 */
 
if (!stats) {
    var stats = function() {
        this.initialize && this.initialize.apply(this, arguments);
        
        this.isObject = function (obj) {
            return (obj !== null && typeof obj === 'object');
        };
        
        /* Default values */
        this.results = {
            count: 0,
            confidence: {
                probability: .95
            },
            data: [],
            dataSorted: [],
            diagram: {
                method: "benard",
                availMethods: [
                    "benard",
                    "herd-johnson",
                    "hazen",
                    "kaplan-meier"
                ],
                values: []
            },
            limits: {
                LSL: null,
                USL: null,
                CL_methods: [
                    'median',
                    'mean'
                ],
                CL_method: 'median'
            },
            quantiles: {
                calc_method: 1,
                data: [],
                nb: 4,
                w_extremities: false
            },
            time: {
                start: null,
                stop: null,
                ellapsed: 0
            }
        };
        
        if (this.isObject(arguments[0])) {
            var arg = arguments[0];
                        
            if (!Array.isArray(arg.data)) { throw "data is not an Array !"; }
            this.populate(arg.data);
            
            if (arg.confidenceProbability)      { this.setConfidenceProbability(arg.confidenceProbability); }
            if (this.isObject(arg.quantiles))   { this.setQuantiles(arg.quantiles); }
            if (this.isObject(arg.limits))      {
                if (arg.limits.USL) { this.setUSL(arg.limits.USL); }
                if (arg.limits.LSL) { this.setLSL(arg.limits.LSL); }
            }
        }
    };
}

if (!stats.extend) {
    stats.extend = function(childPrototype) {
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

stats = stats.extend({
    browser: function () {
        /**
         * Detect user agent
         * 
         * Return an object with (true|false) for each
         **/
        var userAgent = navigator.userAgent.toLowerCase();
        
        var browser = {
           userAgent: userAgent,
           chrome: /chrome/.test( userAgent ),
           safari: /webkit/.test( userAgent ) && !/chrome/.test( userAgent ),
           opera: /opera/.test( userAgent ),
           msie: /msie/.test( userAgent ) && !/opera/.test( userAgent ),
           mozilla: /mozilla/.test( userAgent ) && !/(compatible|webkit)/.test( userAgent )
        };
        
        browser.version = (userAgent.match( /.+(?:rv|it|ra|ie|me)[/: ]([d.]+)/ ) || [])[1];
        
        return browser;
    },
    
    // Core functions
    core: {
        /* Constants */
        ONE_SQRT_2PI:   0.3989422804014327              ,
        LN_SQRT_2PI:    0.9189385332046727417803297     ,
        LN_SQRT_PId2:   0.225791352644727432363097614947,
        DBL_MIN:        2.22507e-308                    ,
        DBL_EPSILON:    2.220446049250313e-16           ,
        SQRT_32:        5.656854249492380195206754896838,
        TWO_PI:         6.283185307179586               ,
        DBL_MIN_EXP:    -999                            ,
        SQRT_2dPI:      0.79788456080287                ,
        LN_SQRT_PI:     0.5723649429247                 ,

        percent_values: [.1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 99.9],
        
        control: {
            coeffs: {
                taille: [ 2    , 3    , 4    , 5    , 6    , 7    , 8    , 9    , 10   , 11  , 12    , 13   , 14   , 15   , 16   , 17   , 18   , 19   , 20    ],
                A2:     [ 1.880, 1.023, 0.729, 0.577, 0.483, 0.419, 0.373, 0.337, 0.308, 0.285, 0.266, 0.249, 0.235, 0.223, 0.212, 0.203, 0.194, 0.187, 0.180 ],
                D3:     [ 0.000, 0.000, 0.000, 0.000, 0.000, 0.076, 0.136, 0.184, 0.223, 0.256, 0.284, 0.308, 0.329, 0.348, 0.364, 0.379, 0.392, 0.404, 0.414 ],
                D4:     [ 3.267, 2.575, 2.282, 2.115, 2.004, 1.924, 1.864, 1.816, 1.777, 1.744, 1.716, 1.692, 1.671, 1.652, 1.636, 1.621, 1.608, 1.596, 1.586 ],
                Sigma:  [ 1.128, 1.693, 2.059, 2.326, 2.534, 2.707, 2.847, 2.970, 3.078, 3.173, 3.258, 3.336, 3.407, 3.472, 3.532, 3.588, 3.640, 3.689, 3.735 ]
            }
        },
        
        // Sort functions
        sortNumbers: function (a, b) { return a - b },
        
        // Round Number
        round: function (val, n) { return parseFloat(Math.round(val * Math.pow(10, n)) / Math.pow(10, n)); },
        
        // Sign of number
        sign: function (x) { return x > 0 ? 1 : x < 0 ? -1 : 0; },
        
        // Check functions
        isPair: function (iValue) {
            if ((iValue / 2) == parseInt(iValue / 2)) { return true; } else { return false; }
        }, 
        
        // Truncate number
        truncate: function (num) {
            return num | 0;
        },
        
        // Normal law
        normale: function(x, esp, ec) {
            var two_ecq = 2*ec*ec;
            var x_mesp = x - esp;
            return (1 / (ec * Math.sqrt(this.TWO_PI))) * Math.exp(- x_mesp*x_mesp / two_ecq);
        },
        
        standardNormalCDF: function (x) {
            var s = x,
                t = 0,
                b = x,
                q = x*x,
                i = 1;
                
            while(s != t) s=(t=s)+(b*=q/(i+=2));
            return 0.5 + s*Math.exp(-0.5*q - 0.91893853320467274178);
        },
        
        normalStdInverse: function (p) {
            /*
             * Lower tail quantile for standard normal distribution function.
             *
             * This function returns an approximation of the inverse cumulative
             * standard normal distribution function.  I.e., given P, it returns
             * an approximation to the X satisfying P = Pr{Z <= X} where Z is a
             * random variable from the standard normal distribution.
             *
             * The algorithm uses a minimax approximation by rational functions
             * and the result has a relative error whose absolute value is less
             * than 1.15e-9.
             *
             * Author:      Peter John Acklam
             * E-mail:      jacklam@math.uio.no
             * WWW URL:     http://home.online.no/~pjacklam/notes/invnorm/
             *
             * Javascript implementation by Liorzou Etienne
             * - Adapted from Dr. Thomas Ziegler's C implementation itself adapted from Peter's Perl version
             * 
             * Q: What about copyright?
             * A: You can use the algorithm for whatever purpose you want, but 
             * please show common courtesy and give credit where credit is due.
             * 
             * If you have any reclamation about this implementation (ie: in this ZeLib.js file),
             * please contact me.
             * 
             */

            /* Coefficients in rational approximations. */
            var a =
                [
                    -3.969683028665376e+01,
                     2.209460984245205e+02,
                    -2.759285104469687e+02,
                     1.383577518672690e+02,
                    -3.066479806614716e+01,
                     2.506628277459239e+00
                ], 
                b =
                [
                    -5.447609879822406e+01,
                     1.615858368580409e+02,
                    -1.556989798598866e+02,
                     6.680131188771972e+01,
                    -1.328068155288572e+01
                ],
                c =
                [
                    -7.784894002430293e-03,
                    -3.223964580411365e-01,
                    -2.400758277161838e+00,
                    -2.549732539343734e+00,
                     4.374664141464968e+00,
                     2.938163982698783e+00
                ],
                d =
                [
                    7.784695709041462e-03,
                    3.224671290700398e-01,
                    2.445134137142996e+00,
                    3.754408661907416e+00
                ],
                LOW = 0.02425,
                HIGH = 0.97575;


            var ltqnorm = function (p) {
                var q, r;

                // errno = 0;

                if (p < 0 || p > 1)
                {
                    // errno = EDOM;
                    return 0.0;
                }
                else if (p == 0)
                {
                    // errno = ERANGE;
                    return Number.NEGATIVE_INFINITY; /* minus "infinity" */;
                }
                else if (p == 1)
                {
                    // errno = ERANGE;
                    return Number.POSITIVE_INFINITY; /* "infinity" */;
                }
                else if (p < LOW)
                {
                    /* Rational approximation for lower region */
                    q = Math.sqrt(-2*Math.log(p));
                    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
                        ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
                }
                else if (p > HIGH)
                {
                    /* Rational approximation for upper region */
                    q  = Math.sqrt(-2*Math.log(1-p));
                    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
                        ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
                }
                else
                {
                    /* Rational approximation for central region */
                        q = p - 0.5;
                        r = q*q;
                    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
                        (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
                }
            }
            
            return ltqnorm(p);
        }
    },
    
    // Set the data array 
    populate: function (data) {
    
        this._data = data.slice();
        
        this.results.count      = this._data.length;
        this.results.data       = this._data.slice();
        this.results.dataSorted = (this._data.slice()).sort(this.core.sortNumbers);
        
        return this._data;
    },
   
    data: function () {
        return this._data.slice();
    },

    /*
        
        SET FUNCTIONS
    
    */
    setConfidenceProbability : function (p) {
        if (p > 1 || p < 0) { console.warn('error: bad parameter'); }
        this.results.confidence.probability = p;
        return p;
    },
    
    setQuantiles: function (o) {
        var n      = o.nb,      // number of quantiles
            method = o.method,  // Method
            ext    = o.withExtremities; // with extremities
            
        if (!method) { method = this.results.quantiles.method; }
        if (!ext)    { ext    = this.results.quantiles.w_extremities; }
        if (!n)      { n      = this.results.quantiles.nb; }
        
        this.results.quantiles.calc_method = method;
        this.results.quantiles.nb = n;
        this.results.quantiles.w_extremities = ext;

    },
    
    setSpecificationLimits: function (lsl, usl) {
        /* Specification limits */
        this.setLSL(lsl);
        this.setUSL(usl);
    },
    
    setUSL: function (usl) {
        /* Upper specification limits */
        this.results.limits.USL = usl;
    },
    
    setLSL: function (lsl) {
        /* Lower specification limits */
        this.results.limits.LSL = lsl;
    },
    
    setMethodControlLimits: function (method) {
        if (this.limits.CL_methods.indexOf(method) != -1) { this.limits.CL_method = method; }
    },
    
    
    /*
        
        CALCULATION FUNCTIONS
    
    */
    count: function () {
        return this.results.count;
    },
    
    min: function () {
        this.results.min = Math.min.apply(0, this._data);
        return this.results.min;
    },
    
    max: function () {
        this.results.max = Math.max.apply(0, this._data);
        return this.results.max;
    },
        
    range: function () {
        /*
            The range is calculated as the difference between the largest and smallest data value.
        */
        this.results.range = this.max() - this.min();
        
        return this.results.range;
    },
    
    sum: function () {
        var nbElem = this.results.count;
        var sum = 0;
        var arr = this._data;
        var i;
        for (i = 0; i < nbElem; i++) { sum += parseFloat(arr[i]); }
        
        this.results.sum = sum;
        
        return this.results.sum;
    },
    
    mean: function () {
        /*
            A commonly used measure of the center of a batch of numbers, which is also called the average.
            It is the sum of all observations divided by the number of (nonmissing) observations.
        */
        if (this._data == undefined) {
            throw 'no data! use populate(data) function before.';
            return false;
        }
        
        var nbElem, sum = 0, i, arr = this._data, res;

        nbElem = arr.length;

        for (i = 0; i < nbElem; i++) { sum = parseFloat(sum) + parseFloat(arr[i]); }
        
        res = parseFloat(sum) / parseFloat(nbElem);
        this.results.mean = res;
        return res;
    },
    
    trMean: function () {
        /* 
            A 5% trimmed mean is calculated.
            Stats.js removes the smallest 5% and the largest 5% of the values (rounded to the nearest integer), 
            and then calculates the mean of the remaining values. 
        */
        
        if (this._data == undefined) {
            throw 'no data! use populate(data) function before.';
            return false;
        }
        //TODO: Verify output value..
        var nbElem = this.results.count,
            nbToRemove = Math.round(0.05*nbElem),
            d;
            
        d = this._data.slice();
        d.sort();
        
        if (nbToRemove != 0) {
            d = d.slice(nbToRemove, -nbToRemove);
        }
        
        var sum = 0, i, res;

        nbElem = d.length;
        for (i = 0; i < nbElem; i++) { sum = parseFloat(sum) + parseFloat(d[i]); }
        res = parseFloat(sum) / parseFloat(nbElem);
        
        this.results.trMean = res;
        return res;
    },
    
    meanDifference: function () {
        var n = this.count(),
            d = this.data(),
            md = [];
            
        for(var i=1; i<n; i++) {
            md.push(Math.abs(d[i]-d[i-1]));
        }
        
        return md;
    },
    
    EMMean: function () {
        var d = this.meanDifference(),
            n = d.length,
            mean = 0;
            
        for (var i=0;i<n;i++) {
            mean += d[i]/n;
        }
        
        this.results.EMMean = mean;
        return mean;
    },
    
    EMMedian: function () {
        var d = this.meanDifference(),
            n = d.length,
            med = 0;
            
        if (this.core.isPair(n)) {
            med = (d[(n / 2) - 1] + d[((n / 2) + 1) - 1]) / 2;
        } else { med = d[(n - 1) / 2]; }
        
        this.results.EMMedian = med;
        return med;
    },
    
    median: function () {
        /*
            The median is in the middle of the data:
            half the observations are less than or equal to it, and half are greater than or equal to it. 
        */
        if (this._data == undefined) {
            throw 'no data! use populate(data) function before.';
            return false;
        }
        
        var i,
            nbElem,
            med,
            arr = this._data;

        arr.sort(this.core.sortNumbers);
        
        nbElem = this.results.count;
        
        if (this.core.isPair(nbElem)) {
            med = (arr[(nbElem / 2) - 1] + arr[((nbElem / 2) + 1) - 1]) / 2;
        } else { med = arr[(nbElem - 1) / 2]; }

        this.results.median = med;
        return med;
    },
    
    variance: function () {
        /*
            Variance is a measure of how far the data are spread about the mean.
        */
        var arr = this._data;
        var i, nbElem, fMoy, fVar, fTmp;

        nbElem = this.results.count;
        fMoy = parseFloat(this.mean());
        fVar = 0;
        for (i = 0; i < nbElem; i++) {
            fTmp = parseFloat(arr[i]) - fMoy;
            fVar = fVar + parseFloat(fTmp * fTmp);
        }

        fVar = parseFloat(fVar) / (nbElem - 1);
        
        // variance
        this.results.variance = fVar;
        
        // variance %
        this.results.variancePerCent = 100 * fVar / (this.max() - this.min());
        
        return fVar;
    },
    
    quantile: function (q, method, withExtremities) {
        var population = this._data.slice(),
            q = this.results.quantiles.nb,
            method = this.results.quantiles.calc_method,
            withExtremities = this.results.quantiles.w_extremities,
            ctx = this,
            k, p, q_re,
            q_quantile = [], m = [];
        
        // 1. Order population
        population.sort(ctx.core.sortNumbers);
        
        // 2. Length of population
        var N = population.length;
        
        // 3. Choice of method
        if (!method || method < 1 || method > 9) { method = 1; }
        
        // Definitions of methods
        m.push(function (p) { // Method 1
            /*
                Inverse of empirical distribution function.
                When p = 0, use x1.
            */
            var h = N * p + 1/2;
            
            if (p==0) { return population[0]; }
            
            return population[Math.ceil(h - 1/2) - 1];
        });
        
        m.push(function (p) { // Method 2 // KO
            /*
                The same as R-1, but with averaging at discontinuities.
                When p = 0, x1.
                When p = 1, use xN.
            */
            var h = N * p + 1/2;
            
            if (p==0) { return population[0]; }
            if (p==1) { return population[N - 1]; }
            
            return (population[Math.ceil(h - 1/2) - 1] + population[Math.floor(h + 1/2) - 1]) / 2;
        });
        
        m.push(function (p) { // Method 3 // KO
            /*
                The observation numbered closest to Np.
                When p = (1/2) / N, use x1.
            */
            var h = N * p;
            
            if (p <= ((1/2)/N)) { return population[0]; }
            
            return population[ctx.core.round(h,0) - 1];
        });
        
        if (q > 100) { q = 100; }
        
        for (k = 0; k <= q; k++) {
            // Calc p
            p = k / q;
            q_quantile.push(m[method - 1](p));
        }
        
        if (withExtremities != true) {
            var _length = q_quantile.length;
            q_re = q_quantile;
            q_quantile = [];
            
            for (k=1; k<_length - 1; k++) { q_quantile.push(q_re[k]); }
        }
        
        this.results.quantiles.data = q_quantile;
        return q_quantile;
    },
    
    Q1: function () {
        /*
            Twenty-five percent of your sample observations are less than or equal to the value of the first quartile.
            Therefore, the first quartile is also referred to as the 25th percentile.
        */
        var w = (this.results.count+1)/4;
        var y = this.core.truncate(w);
        var z = w-y;
        var x = this._data;
        
        // JS Arrays are 0-indexed
        y--;
        
        var r = x[y]+z*(x[y+1] - x[y]);
        
        this.results.Q1 = r;
        
        return r;
    },
    
    Q3: function () {
        /*
            Seventy-five percent of your sample observations are less than or equal to the value of the third quartile.
            Therefore, the third quartile is also referred to as the 75th percentile.
        */
        var w = 3*(this.results.count+1)/4;
        var y = this.core.truncate(w);
        var z = w-y;
        var x = this._data;
        
        // JS Arrays are 0-indexed
        y--;
        
        var r = x[y]+z*(x[y+1] - x[y]);
        
        this.results.Q3 = r;
        
        return r;
    },
    
    IQR: function () {
        /*
            The interquartile range equals the third quartile minus the first quartile. 
        */
        this.results.IQR = this.Q3() - this.Q1();
        
        return this.results.IQR;
    },
    
    stDev: function () {
        /*
            The sample standard deviation provides a measure of the spread of your data.
            It is equal to the square root of the sample variance.
        */
        this.results.stDev = Math.sqrt(this.variance());
        return this.results.stDev;
    
    },
    
    SEMean: function () {
        /*
            The standard error of the mean is calculated as standard deviation divided by the square root of n.
        */
        var s = this.stDev();
        var n = this.results.count;
        
        this.results.SEMean = s/Math.sqrt(n);
        
        return this.results.SEMean;
    },
    
    coefVar: function () {
        /*
            The coefficient of variation is a measure of relative variability calculated as a percentage:
                                       standard deviation
            coefficient of variation = ------------------
                                            mean
        */
        var s = this.stDev();
        var x = this.mean();
        
        this.results.coefVar = 100*s/x;
        
        return this.results.coefVar;
    },
    
    Anderson_Darling: function () {
        /*
            Measures the area between the fitted line (based on chosen distribution) and the nonparametric step function (based on the plot points).
            The statistic is a squared distance that is weighted more heavily in the tails of the distribution.
            Smaller Anderson-Darling values indicates that the distribution fits the data better.
        */
        var n = this.results.count,
            X = this._data.slice(),
            m = this.mean(),
            stDev = this.stDev(),
            sum = 0,
            sncdf = this.core.standardNormalCDF,
            A2, Y, i, j;
        
        // sort data
        X.sort(this.core.sortNumbers);
        
        for(i=1; i<=n; i++) {
            j = i-1;
            Y = sncdf((X[j] - m)/stDev);
            sum += (2*i - 1)*Math.log(Y) + (2*n + 1 - 2*i)*Math.log(1 - Y);
        }
        
        A2 = -n-(1/n) * sum;
        
        this.results.Anderson_Darling = A2;
        
        return A2;
    },
    
    p_value: function () {
        /*
            Another quantitative measure for reporting the result of the Anderson-Darling normality test is the p-value.
            A small p-value is an indication that the null hypothesis is false. 
        */
        var A2 = this.Anderson_Darling(),
            N = this.results.count,
            A2p, p;
            
        A2p = A2 * (1 + 0.75/N + 2.25/(N*N));
        
        if (13 > A2p && A2p > 0.6) {
            p = Math.exp(1.2937 - 5.709 * A2p + 0.0186*(A2p * A2p));
        } else if (0.600 > A2p && A2p > 0.340) {
            p = Math.exp(0.9177 - 4.279 * A2p - 1.38*(A2p * A2p) );
        } else if (0.340 > A2p && A2p > 0.200) {
            p = 1 - Math.exp(-8.318 + 42.796 * A2p - 59.938*(A2p * A2p) );
        } else if (A2p < 0.200) {
            p = 1 - Math.exp(-13.436 + 101.14 * A2p - 223.73*(A2p * A2p) )  
        }
        
        this.results.p_value = p;
        return p;   
    },
    
    prob_values: function (method) {
        var r = this._data.slice(),
            n = r.length,            
            out = [];
        
        if (method == undefined) { method = 'benard'; }
        r.sort(this.core.sortNumbers);
        
        var benard = function () {
            var out = [];
            for (var i = 1; i<n+1; i++) {
                out.push((i-.3)/(n+.4));
            }
            
            return out;
        };
        
        var herd_johnson = function () {
            var out = [];
            for (var i = 1; i<n+1; i++) {
                out.push(i/(n+1));
            }
            
            return out;
        };
        
        var hazen = function () {
            var out = [];
            if (n != 0) {
                for (var i = 1; i<n+1; i++) {
                    out.push((i-.5)/n);
                }
            }
            
            return out;
        };
        
        var kaplan_meier = function () {
            var out = [];
            if (n != 0) {
                for (var i = 1; i<n+1; i++) {
                    out.push(i/n);
                }
            }
            
            return out;
        };
        
        switch (method) {
            case 'benard':
                out = benard();
                break;
            case 'herd-johnson':
                out = herd_johnson();
                break;
            case 'hazen':
                out = hazen();
                break;
            case 'kaplan-meier':
                out = kaplan_meier();
                break;
            default:
                method = 'bad parameter';
                out = [];
                break;
        }

        this.results.diagram.method = method;
        this.results.diagram.values = out;
        return this.results.diagram;
    },
    
    histo_values: function (o) {
        var d = this.results.dataSorted.slice();
        var nbInter,
            arrInter = [],
            min      = this.min(),
            max      = this.max(),
            range    = this.range(),
            n        = this.results.count;
        
        if (!o) { o = {}; }
        
        nbInter = o.nbIntervals ? o.nbIntervals : 10;
        
        for(var i=0; i<nbInter; i++) {
            arrInter.push({
                min: min+i*range/nbInter, 
                max: min+(i+1)*range/nbInter,
                n: 0
            });
        }
        
        for(var i=0; i<n-1; i++) {
            arrInter[parseInt((100*(d[i]-min)/range)/nbInter, 10)].n++;
        }
        arrInter[nbInter-1].n++;
        
        this.results.histogram = {
            nbIntervals:    nbInter,
            intervals:      arrInter,
            width:          range/nbInter
        };
        
        return this.results.histogram;
    },
    
    inverf: function (x) {
        /* error function inverse calc */
        /* Use approximation by serie expansion */
        var out,
            a = 0.147,
            tm = Math.log(1-Math.pow(x,2)) / 2,
            tma = Math.log(1-Math.pow(x,2)) / a,
            two_pi_a = 2 / (Math.PI * a);
        
        out = Math.pow(two_pi_a + tm, 2) - tma;
        out = Math.sqrt(out) - (two_pi_a + tm);
        out = this.core.sign(x) * Math.sqrt(out);
                
        return out;
    },
    
    quantile025normal: function (p) {
        return Math.sqrt(2) * this.inverf(p);
    },
    
    confidence_interval: function () {
        /* Calculate confidence interval for arr given in parameter */
        var p   = this.results.confidence.probability,
            avg = this.mean(),
            ec  = this.stDev(),
            n   = this.results.count,
            q   = this.quantile025normal(p);
        
        this.results.confidence.interval = [avg - q*ec/Math.sqrt(n), avg + q*ec/Math.sqrt(n)];
        return this.results.confidence.interval;
    },
    
    LSL: function () {
        return this.results.limits.LSL;
    },
    
    USL: function () {
        return this.results.limits.USL;
    },
    
    Cp: function () {
        var usl = this.USL(),
            lsl = this.LSL(),
            Sst = this.stDev();
            
        this.results.Cp = (usl - lsl) / (6 * Sst);
        
        return this.results.Cp;
    },
    
    Pp: function () {
        var usl = this.USL(),
            lsl = this.LSL(),
            Slt = this.stDev();
            
        this.results.Pp = (usl - lsl) / (6 * Slt);
        
        return this.results.Pp;
    },
    
    CPU: function () {
        var usl     = this.USL(),
            x_barre = this.mean(),
            Sst     = this.stDev();
            
        this.results.CPU = (usl - x_barre) / (3*Sst);
        
        return this.results.CPU;
    },
    
    PPU: function () {
        var usl     = this.USL(),
            x_barre = this.mean(),
            Slt     = this.stDev();
            
        this.results.PPU = (usl - x_barre) / (3*Slt);
        
        return this.results.PPU;
    },
    
    CPL: function () {
        var lsl     = this.LSL(),
            x_barre = this.mean(),
            Sst     = this.stDev();
            
        this.results.CPL = (x_barre - lsl) / (3*Sst);
        
        return this.results.CPL;
    },
    
    PPL: function () {
        var lsl     = this.LSL(),
            x_barre = this.mean(),
            Slt     = this.stDev();
            
        this.results.PPL = (x_barre - lsl) / (3*Slt);
        
        return this.results.PPL;
    }, 
    
    Cpk: function () {
        this.results.Cpk = Math.min(this.CPU(), this.CPL());
        return this.results.Cpk;
    },
    
    Ppk: function () {
        this.results.Ppk = Math.min(this.PPU(), this.PPL());
        return this.results.Ppk;
    },
    
    ControlLimits: function () {
        var x_barre       = this.mean(),
            r_barre       = this.EMMedian(),
            mr_barre      = this.EMMean(),
            
            lcl           = undefined,
            ucl           = undefined,
            
            mean_method   = function () {
                lcl = x_barre - 3.14*r_barre;
                ucl = x_barre + 3.14*r_barre;
            },
            
            median_method = function () {
                lcl = x_barre - 2.66*mr_barre;
                ucl = x_barre + 2.66*mr_barre;
            };
            
            switch (this.results.limits.CL_method) {
                case 'mean':
                    mean_method();
                    break;
                case 'median':
                    median_method();
                    break;
                default: // mean by default
                    mean_method();
                    break;
            }
            
            this.results.LCL = lcl;
            this.results.UCL = ucl;
            
            return [lcl, ucl];
    },
    
    UCL: function () {            
        this.results.UCL = this.ControlLimits()[1];
        return this.results.UCL;
    },
    
    LCL: function () {
        this.results.LCL = this.ControlLimits()[0];;
        return this.results.LCL;
    },
    
    // Execute all functions
    executeAll: function () {
        // Start Chrono
        var d = new Date();
        this.results.time.start = d;
        var n = d.valueOf();
        
        // Execute functions
        this.sum();
        this.mean();
        this.trMean();
        this.median();
        this.min();
        this.max();
        this.range();
        this.Q1();
        this.Q3();
        this.IQR();
        this.stDev();
        this.SEMean();
        this.coefVar();
        this.variance();
        this.confidence_interval();
        this.Anderson_Darling();
        this.p_value();
        this.quantile();
        this.prob_values();
        this.histo_values();
        
        // Capability
        this.Cp();
        this.Pp();
        this.CPU();
        this.PPU();
        this.CPL();
        this.PPL();
        this.Cpk();
        this.Ppk();
        this.UCL();
        this.LCL();


        // Stop chrono
        d = new Date();
        this.results.time.stop = d;
        this.results.time.ellapsed = d.valueOf() - n;
        
        return this.results;
    }
});