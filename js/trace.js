var makeTrace = function (f, p, dt) {
    //generates a trace of a multidimensional first order differential equation using the runga-kutta method.
    //f - the differential equation
    //p - the initial position of the trace
    //dt - the step size of the approximation.
    return {
        trace: [],
        p: p,
        f: f,
        dt: dt,
        t: 0,
        //Advance n steps, maintaining a constant array length.
        move: function (n) {
            var trace = n < this.trace.length ? this.trace.slice(n) : [],
                p = this.p,
                f1 = this.f.live_f || this.f;
                f = f1.bind(this),
                dt = this.dt;
            this.t += this.dt;
            for (var i = n; i--;) {
                trace.push(p);
                p = p.rk4(f, dt);
                p = p.rk4(f, dt);
                p = p.rk4(f, dt);
            }
            this.p = p;
            this.trace = trace;
            return this;
        }
    }
}
var makeLorenz = function (a, r, b) {
    return function (p) {
        var x = p[0], y = p[1], z = p[2];
        return [
                a * (y - x),
                x * (r - z) - y,
                x * y - b * z
        ];
    }
};
