//differential solvers.

Array.prototype.scale = function (s) {
    for (var i = this.length; i--;) {
        this[i] = this[i] * s;
    }
    return this;
}

Array.prototype.add = function (v) {
    for (var i = this.length; i--; ) {
        this[i] = this[i] + v[i];
    }
    return this;
}

Array.prototype.as = function(s, dt) {
    for(var i = this.length; i--; ) {
        this[i] = this[i] + dt * s[i];
    }
    return this;
}

Array.prototype.step = function (f, dt) {
    return this.as(f(this), dt);
}

Array.prototype.step2 = function (f, dt) {
    var temp = this.slice(0).step(f, dt/2);
    return this.add(f(temp).scale(dt));
}

Array.prototype.rk4 = function (f, dt) {
    var m1 = f(this);
    var m2 = f(this.slice(0).as(m1, dt / 2));
    var m3 = f(this.slice(0).as(m2, dt / 2));
    var m4 = f(this.slice(0).as(m3, dt));
    return this.slice(0).add(m1.as(m2, 2).as(m3, 2).add(m4).scale(dt / 6));
}

Array.prototype.predCor = function (f, dt, h) {
}