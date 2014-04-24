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

/*
 * Stats
 * JS Stats library
 * 
 * author : E. Liorzou
 * 
 */
var stats = Class.extend({
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
        
        // Sort functions
        sortNumbers: function (a, b) { return a - b },
        
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
        this.results = {
            time: {}
        };
        
        this._data = data.slice();
        
        this.results.count = this.count();
        return this._data;
    },
   
    count: function () {
        this.results.count = this._data.length;
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
        
    range: function () {
        /*
            The range is calculated as the difference between the largest and smallest data value.
        */
        this.results.range = this.max() - this.min();
        
        return this.results.range;
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
    
    prob_values: function () {
        var data = this.core.percent_values.slice(),
            n = data.length,
            esp = this.mean(),
            ec = this.stDev(),
            i, r1 = [], r2 = [];
        
        for (i=0; i<n; i++) { r1.push({ x: this.core.normalStdInverse(data[i]/100)*ec+esp, y: data[i]}); }
       
        data = this._data.slice();
        data.sort(this.core.sortNumbers);
        
        n = data.length;
        
        for (i=0; i<n; i++) { r2.push(this.core.standardNormalCDF((data[i] - esp)/ec)*100); }
        //this.core.standardNormalCDF((m - esp)/ec)*100
        this.results.prob_values = {
            theorical: r1.slice(),
            calc: r2.slice()
        };
        
        return this.results.prob_values;
    },
    
    cpk: function (tolMin, tolMax) {
        var ec3 = 3 * this.ecartType();
        var mean = this.mean();
        
        this.results.cpk = Math.min(
            (mean - tolMin) / ec3,
            (tolMax - mean) / ec3
        );
        
        return this.results.cpk;
    },

    LCI: function () {
        // Calculer la moyenne de l'etendue mobile
        // cf Minitab
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
        this.Anderson_Darling();
        this.p_value();
        this.prob_values();
        
        // Stop chrono
        d = new Date();
        this.results.time.stop = d;
        this.results.time.ellapsed = d.valueOf() - n;
        
        return this.results;
    }
});